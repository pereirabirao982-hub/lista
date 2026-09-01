import { type ReactNode, useEffect, useRef } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import HomePage from '@/pages/home';
import UserPortalPage from '@/pages/user-portal';
import AdminPage from '@/pages/admin';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

function stripBase(path: string) { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path; }

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: '#17373B', colorForeground: '#17373B', colorMutedForeground: '#607276', colorDanger: '#B94740', colorBackground: '#FFFCF4', colorInput: '#F6F0E5', colorInputForeground: '#17373B', colorNeutral: '#D8CEC0', fontFamily: 'DM Sans, sans-serif', borderRadius: '1rem' },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#FFFCF4] rounded-3xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#17373B] font-semibold',
    headerSubtitle: 'text-[#607276]',
    socialButtonsBlockButtonText: 'text-[#17373B] font-semibold',
    formFieldLabel: 'text-[#17373B] font-semibold',
    footerActionLink: 'text-[#B9513B] font-semibold',
    footerActionText: 'text-[#607276]',
    dividerText: 'text-[#607276]',
    identityPreviewEditButton: 'text-[#B9513B]',
    formFieldSuccessText: 'text-emerald-700',
    alertText: 'text-[#B94740]',
    logoBox: 'rounded-xl',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-[#D8CEC0] bg-[#F6F0E5] hover:bg-[#EEE5D7]',
    formButtonPrimary: 'bg-[#17373B] hover:bg-[#214B50] text-[#FFF9EE] rounded-full',
    formFieldInput: 'bg-[#F6F0E5] border-[#D8CEC0] text-[#17373B] rounded-xl',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#D8CEC0]',
    alert: 'bg-[#FBE9E5] border-[#EDB9AE]',
    otpCodeFieldInput: 'bg-[#F6F0E5] border-[#D8CEC0] text-[#17373B]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background" />;
  return isSignedIn ? <Redirect to="/user-portal" /> : <HomePage />;
}

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background" />;
  return isSignedIn ? <>{children}</> : <Redirect to="/" />;
}

function SignInPage() {
  return <div className="paper-grain flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}
function SignUpPage() {
  return <div className="paper-grain flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (previous.current !== undefined && previous.current !== id) client.clear();
      previous.current = id;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkApp() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Boas-vindas de volta', subtitle: 'Entre para acessar seu convite' } }, signUp: { start: { title: 'Crie seu acesso', subtitle: 'Seu convite começa por aqui' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator />
      <RoutedErrorBoundary><Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/user-portal"><Protected><UserPortalPage /></Protected></Route>
        <Route path="/admin"><Protected><AdminPage /></Protected></Route>
        <Route component={NotFound} />
      </Switch></RoutedErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  </ClerkProvider>;
}

function App() { return <WouterRouter base={basePath}><ClerkApp /></WouterRouter>; }

export default App;