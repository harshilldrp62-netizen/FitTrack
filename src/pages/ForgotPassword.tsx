import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, ArrowLeft, ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSuccess(true);
    toast({
      title: "Reset link sent!",
      description: `Check your ${method === "email" ? "email inbox" : "phone messages"} for the reset link.`,
    });
    
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center overflow-y-auto">
        <div className="    pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md text-center relative z-10 animate-slide-up">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/20 mb-8">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h1 className="mobile-title text-foreground mb-4">
            Check your {method === "email" ? "inbox" : "messages"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            We've sent a password reset link to your {method}.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full" size="lg">
            Back to Login
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden overflow-y-auto">
      <div className="    pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Back Button */}
      <div className="p-4 relative z-10">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to login
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center pb-12 relative z-10">
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow mb-6">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="mobile-title text-foreground mb-2">
            Reset Password
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your email or phone to receive a reset link
          </p>
        </div>

        <div className="w-full max-w-md mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* Toggle Email/Phone */}
          <div className="flex bg-secondary rounded-xl p-1.5 mb-8">
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-300 ${
                method === "email"
                  ? "bg-gradient-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-300 ${
                method === "phone"
                  ? "bg-gradient-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {method === "email" ? (
              <Input
                type="email"
                placeholder="Enter your email address"
                icon={<Mail className="w-5 h-5" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            ) : (
              <Input
                type="tel"
                placeholder="Enter your phone number"
                icon={<Phone className="w-5 h-5" />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
