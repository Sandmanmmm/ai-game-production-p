import React, { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Eye, EyeOff, Mail, Lock, Github, Loader2, User } from "lucide-react";

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, loginWithGitHub, loginWithGoogle } = useContext(AuthContext);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  // Register state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  
  // Active tab based on route
  const [activeTab, setActiveTab] = useState(() => {
    return location.pathname === "/register" ? "signup" : "login";
  });

  // Update tab when route changes
  useEffect(() => {
    setActiveTab(location.pathname === "/register" ? "signup" : "login");
  }, [location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    
    try {
      await login(loginEmail, loginPassword);
      // Success transition will be handled by auth context
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");
    
    try {
      await register(registerEmail, registerPassword, registerName);
      // Success transition will be handled by auth context
    } catch (err: any) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  // Handle tab change and route navigation
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(value === "login" ? "/login" : "/register");
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Animated background particles/stars */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="twinkling"></div>
      </div>
      
      {/* Branding animation */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex items-center space-x-3 animate-fadeIn">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-2xl font-bold text-white">🔥</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">
            Game<span className="text-orange-400">Forge</span>
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-8">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl animate-slideUp">
          <CardHeader className="text-center pb-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                {activeTab === "login" ? "Welcome Back" : "Join GameForge"}
              </h2>
              <p className="text-white/70">
                {activeTab === "login" 
                  ? "Enter your credentials to access GameForge" 
                  : "Create your account and start building games"
                }
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 transition-all duration-200"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 transition-all duration-200"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-6 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-slideUp">
                      <p className="text-red-400 text-sm">{loginError}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-orange-400/50 focus:ring-orange-400/20 h-12"
                        required
                        disabled={loginLoading}
                        onKeyPress={(e) => handleKeyPress(e, () => handleLogin(e as any))}
                      />
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-orange-400/50 focus:ring-orange-400/20 h-12"
                        required
                        disabled={loginLoading}
                        onKeyPress={(e) => handleKeyPress(e, () => handleLogin(e as any))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Forging Access...</span>
                      </div>
                    ) : (
                      "Login"
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <a 
                      href="#" 
                      className="text-orange-400 hover:text-orange-300 text-sm transition-colors hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-6 mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  {registerError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-slideUp">
                      <p className="text-red-400 text-sm">{registerError}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-orange-400/50 focus:ring-orange-400/20 h-12"
                        required
                        disabled={registerLoading}
                      />
                    </div>
                    
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-orange-400/50 focus:ring-orange-400/20 h-12"
                        required
                        disabled={registerLoading}
                      />
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
                      <Input
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 characters)"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-12 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-orange-400/50 focus:ring-orange-400/20 h-12"
                        minLength={6}
                        required
                        disabled={registerLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        tabIndex={-1}
                      >
                        {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                    disabled={registerLoading}
                  >
                    {registerLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Forging Account...</span>
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Social Login Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="px-4 text-white/60 text-sm">OR</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-200 transform hover:scale-[1.02] py-6"
                onClick={loginWithGitHub}
              >
                <Github className="w-5 h-5 mr-3" />
                Continue with GitHub
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-200 transform hover:scale-[1.02] py-6"
                onClick={loginWithGoogle}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </div>

            {/* Footer CTA */}
            <div className="text-center mt-6">
              <p className="text-white/60 text-sm">
                {activeTab === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      onClick={() => handleTabChange("signup")}
                      className="text-orange-400 hover:text-orange-300 transition-colors hover:underline font-medium"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      onClick={() => handleTabChange("login")}
                      className="text-orange-400 hover:text-orange-300 transition-colors hover:underline font-medium"
                    >
                      Login
                    </button>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
