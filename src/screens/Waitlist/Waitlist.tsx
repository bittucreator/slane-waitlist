import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

export const Waitlist = (): JSX.Element => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showSubtext, setShowSubtext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(true);
  const [countError, setCountError] = useState(false);

  // Function to fetch waitlist count
  const fetchWaitlistCount = async () => {
    try {
      setCountLoading(true);
      setCountError(false);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-waitlist-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWaitlistCount(data.count || 0);
      } else {
        console.error('Failed to fetch waitlist count');
        setCountError(true);
      }
    } catch (error) {
      console.error('Error fetching waitlist count:', error);
      setCountError(true);
    } finally {
      setCountLoading(false);
    }
  };

  // Initial load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch waitlist count on component mount
  useEffect(() => {
    fetchWaitlistCount();
  }, []);

  const handleSubmit = async () => {
    if (name.trim() && email.trim()) {
      setIsSubmitting(true);
      setError("");
      
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-to-waitlist`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to join waitlist');
        }

        // Success - proceed with animation and refresh count
        setIsTransitioning(true);
        setTimeout(() => {
          setIsSubmitted(true);
          setIsTransitioning(false);
          // Refresh the count after successful submission
          fetchWaitlistCount();
        }, 300);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Typewriter effect for thank you message
  useEffect(() => {
    if (isSubmitted && !isTransitioning) {
      const thankYouText = `Thanks for joining the waitlist, ${name}!`;
      let currentIndex = 0;
      setDisplayedText("");
      setShowSubtext(false);
      
      const typeInterval = setInterval(() => {
        if (currentIndex < thankYouText.length) {
          setDisplayedText(thankYouText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setShowSubtext(true), 200);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    }
  }, [isSubmitted, isTransitioning, name]);

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsTransitioning(false);
      setName("");
      setEmail("");
    }, 300);
  };

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className={`bg-light-modebasebackground w-full h-screen flex items-center justify-center transition-all duration-700 ease-out ${
        isLoaded ? 'opacity-100 transform translate-y-0 blur-0' : 'opacity-0 transform translate-y-4 blur-sm'
      }`}>
        <Card className="w-[446px] p-6 flex flex-col items-center justify-center gap-6 bg-transparent border-none shadow-none relative overflow-hidden">
          <CardContent className="p-0 flex flex-col items-center gap-6 w-full relative">
            {/* Blur overlay during transition */}
            {isTransitioning && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 transition-all duration-300 ease-out" />
            )}
            
            {!isSubmitted ? (
              <div className={`flex flex-col items-center gap-6 w-full transition-all duration-300 ease-out ${
                isTransitioning ? 'opacity-0 transform translate-y-2 blur-sm' : 'opacity-100 transform translate-y-0 blur-0'
              }`}>
                <div className="flex flex-col items-center gap-6 w-full">
                  <img className="w-10 h-10" alt="Slane logo" src="/Slane.png" />

                  <div className="flex flex-col w-full items-center gap-[7px]">
                    <h1 className="font-medium text-black text-lg text-center [font-family:'Inter',Helvetica] w-full">
                      Slane
                    </h1>
                    <p className="font-normal text-[#00000080] text-[13px] text-center [font-family:'Inter',Helvetica] w-full">
                      a minimal to-do app for founders and designers
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 w-full">
                  <Input
                    className="h-[41px] bg-[#f4f4f4] text-xs text-black placeholder:text-[#00000080] [font-family:'Inter',Helvetica] font-normal rounded-none shadow-none border-none"
                    placeholder="your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <Input
                    className="h-[41px] bg-[#f4f4f4] text-xs text-black placeholder:text-[#00000080] [font-family:'Inter',Helvetica] font-normal rounded-none shadow-none border-none"
                    placeholder="and email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Button 
                    className="w-full h-10 bg-black text-white hover:bg-black/90 [font-family:'Inter',Helvetica] font-medium rounded-none transition-all duration-200 ease-out hover:transform hover:scale-[0.98] active:scale-95"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !name.trim() || !email.trim()}
                  >
                    {isSubmitting ? 'Joining...' : 'Join waitlist'}
                  </Button>
                  
                  {error && (
                    <p className="text-red-500 text-xs text-center [font-family:'Inter',Helvetica] w-full">
                      {error}
                    </p>
                  )}
                  
                  {/* Waitlist count display */}
                  <div className="flex justify-center w-full">
                    {countLoading ? (
                      <div className="h-[18px] w-32 bg-gray-100 animate-pulse rounded"></div>
                    ) : countError ? (
                      <p className="font-normal text-[#00000040] text-[11px] text-center [font-family:'Inter',Helvetica] transition-all duration-500 ease-out">
                        join the waitlist
                      </p>
                    ) : waitlistCount !== null ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="relative">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <p className="font-normal text-[#000000] text-[11px] text-center [font-family:'Inter',Helvetica] transition-all duration-500 ease-out">
                          {waitlistCount} cool {waitlistCount === 1 ? 'person' : 'folks'} already joined!
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex flex-col items-center gap-6 w-full transition-all duration-500 ease-out ${
                isTransitioning ? 'opacity-0 transform translate-y-2 blur-sm' : 'opacity-100 transform translate-y-0 blur-0'
              }`}>
                <img className="w-10 h-10" alt="Slane logo" src="/Slane.png" />
                
                <div className="flex flex-col w-full items-center gap-[7px]">
                  <h1 className="font-medium text-black text-lg text-center [font-family:'Inter',Helvetica] w-full min-h-[28px]">
                    {displayedText}
                    <span className="animate-pulse">|</span>
                  </h1>
                  <p className={`font-normal text-[#00000080] text-[13px] text-center [font-family:'Inter',Helvetica] w-full transition-all duration-300 ease-out ${
                    showSubtext ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                  }`}>
                    We'll notify you when Slane is live
                  </p>
                </div>
                
                <div className={`w-full transition-all duration-300 ease-out delay-300 ${
                  showSubtext ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
                }`}>
                  <Button 
                    className="w-full h-10 bg-transparent text-black hover:bg-gray-50 border border-gray-200 [font-family:'Inter',Helvetica] font-medium rounded-none transition-all duration-200 ease-out hover:transform hover:scale-[0.98] active:scale-95 shadow-none"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};