import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          id: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: 'client',
          createdAt: new Date()
        });
      }
      
      toast.success('Signed in successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Sign in failed. Please try again.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', result.user.uid), {
          id: result.user.uid,
          email: result.user.email,
          role: 'client',
          createdAt: new Date()
        });
        toast.success('Account created!');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-12">
      <div className="bg-dark-surface w-full max-w-[440px] rounded-[32px] p-8 border border-dark-border shadow-2xl">
        <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tight">
          {isLogin ? 'Welcome Back' : 'Get Started'}
        </h2>
        <p className="text-neutral-500 text-center text-sm mb-8 font-medium">
          {isLogin ? 'Choose your login method to continue' : 'Join thousands of professionals and clients'}
        </p>
        
        <div className="flex flex-col gap-5">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-3 bg-white text-black h-14 rounded-2xl font-bold hover:bg-neutral-200 border-none transition-all"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>
          
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dark-border"></div></div>
            <span className="relative bg-dark-surface px-4 text-[10px] font-black text-neutral-600 uppercase tracking-widest">Or continue with mail</span>
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-neutral-400 ml-1">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                className="w-full h-14 bg-neutral-900 border-dark-border rounded-2xl px-5 text-sm focus:ring-2 focus:ring-brand/50 text-white transition-all placeholder:text-neutral-700"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" title="password" className="text-xs font-bold text-neutral-400 ml-1">Password</Label>
              <Input 
                id="password" 
                type="password" 
                className="w-full h-14 bg-neutral-900 border-dark-border rounded-2xl px-5 text-sm focus:ring-2 focus:ring-brand/50 text-white transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              className="w-full h-14 bg-brand text-black font-black text-lg rounded-2xl hover:bg-brand-light transition-all shadow-lg shadow-brand/20 mt-2" 
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-4">
            {isLogin ? "New to the platform?" : "Already have an account?"}
            <button 
              className="text-white font-bold ml-1 hover:text-brand transition-colors"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="mt-8 p-4 bg-brand/5 border border-brand/20 rounded-2xl">
          <p className="text-[10px] uppercase font-black text-brand tracking-[0.2em] mb-1.5">Admin Access</p>
          <div className="space-y-2">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Login with <span className="text-white font-medium">chonjifuaclinton93@gmail.com</span> for system admin access.
            </p>
            <div className="pt-2 border-t border-brand/10">
              <p className="text-[9px] uppercase font-bold text-neutral-600 tracking-wider mb-1">Legacy Admin</p>
              <p className="text-xs text-neutral-500 flex justify-between">Email: <span className="text-neutral-400">admin@booksy.com</span></p>
              <p className="text-xs text-neutral-500 flex justify-between mt-0.5">Pass: <span className="text-neutral-400">BooksyAdmin2026!</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
