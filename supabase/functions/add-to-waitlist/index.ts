const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { name, email } = await req.json()

    // Validate input
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'Name and email are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Notion credentials from environment variables
    const notionSecret = Deno.env.get('NOTION_SECRET')
    const databaseId = Deno.env.get('NOTION_DATABASE_ID')

    if (!notionSecret || !databaseId) {
      console.error('Notion credentials not configured')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Please configure NOTION_SECRET and NOTION_DATABASE_ID in Supabase environment variables'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Making request to Notion API...')
    console.log('Database ID:', databaseId)

    // Make request to Notion API
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionSecret}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId,
        },
        properties: {
          Name: {
            title: [
              {
                type: "text",
                text: {
                  content: name,
                },
              },
            ],
          },
          Email: {
            email: email,
          },
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Notion API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to add to waitlist',
          details: `Notion API error: ${response.status} ${response.statusText}`,
          notionError: errorData
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('Successfully added to Notion:', data.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id,
        message: 'Successfully added to waitlist'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in add-to-waitlist function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})