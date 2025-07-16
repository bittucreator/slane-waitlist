const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
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

    console.log('Making request to Notion API to get count...')
    console.log('Database ID:', databaseId)

    // Query the Notion database to get count
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionSecret}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        page_size: 1, // We only need to know the count, not fetch all data
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
          error: 'Failed to get waitlist count',
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
    const count = data.results ? data.results.length : 0
    
    // Notion returns a has_more property and we need to handle pagination for accurate count
    let totalCount = count
    let hasMore = data.has_more
    let nextCursor = data.next_cursor

    // If there are more results, we need to make additional requests to get the exact count
    while (hasMore) {
      const nextResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionSecret}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          page_size: 100, // Maximum page size
          start_cursor: nextCursor,
        }),
      })

      if (nextResponse.ok) {
        const nextData = await nextResponse.json()
        totalCount += nextData.results ? nextData.results.length : 0
        hasMore = nextData.has_more
        nextCursor = nextData.next_cursor
      } else {
        break
      }
    }

    console.log('Total waitlist count:', totalCount)

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: totalCount,
        message: 'Successfully retrieved waitlist count'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-waitlist-count function:', error)
    
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