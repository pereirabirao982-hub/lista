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
  variables: {
    colorPrimary: 'hsl(185, 45%, 15%)',
    colorForeground: 'hsl(185, 45%, 15%)',
    colorMutedForeground: 'hsl(185, 20%, 45%)',
    colorDanger: 'hsl(0, 70%, 50%)',
    colorBackground: 'hsl(43, 33%, 98%)',
    colorInput: 'hsl(43, 33%, 96%)',
    colorInputForeground: 'hsl(185, 45%, 15%)',
    colorNeutral: 'hsl(40, 20%, 84%)',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.75rem'
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-card rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-primary/5 border border-border',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-primary font-serif font-medium text-3xl mb-1',
    headerSubtitle: 'text-muted-foreground text-sm',
    socialButtonsBlockButtonText: 'text-primary font-medium',
    formFieldLabel: 'text-primary font-medium text-sm',
    footerActionLink: 'text-accent font-medium hover:text-accent/80',
    footerActionText: 'text-muted-foreground',
    dividerText: 'text-muted-foreground text-xs uppercase tracking-widest mono',
    identityPreviewEditButton: 'text-accent',
    formFieldSuccessText: 'text-emerald-600',
    alertText: 'text-destructive',
    logoBox: 'rounded-xl',
    logoImage: 'rounded-xl',
    socialButtonsBlockButton: 'border-border bg-background hover:bg-secondary transition-colors h-11 rounded-xl',
    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-md transition-transform hover:-translate-y-0.5 h-11 font-medium',
    formFieldInput: 'bg-background border-border text-primary rounded-xl focus:border-accent focus:ring-accent h-11',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-border',
    alert: 'bg-destructive/10 border-destructive/20 text-destructive rounded-xl',
    otpCodeFieldInput: 'bg-background border-border text-primary rounded-xl h-12 text-lg',
    formFieldRow: 'gap-4',
    main: 'gap-6',
  },
};

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background paper-grain" />;
  return isSignedIn ? <Redirect to="/user-portal" /> : <HomePage />;
}

function Protected({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="min-h-[100dvh] bg-background paper-grain" />;
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
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        locale: 'pt-BR',
        socialButtonsBlockButton: 'Continuar com {{provider|titleize}}',
        dividerText: 'ou',
        formFieldLabel__emailAddress: 'Endereço de e-mail',
        formFieldLabel__password: 'Senha',
        formFieldLabel__firstName: 'Nome',
        formFieldLabel__lastName: 'Sobrenome',
        formFieldInputPlaceholder__emailAddress: 'Digite seu e-mail',
        formFieldInputPlaceholder__password: 'Digite sua senha',
        formFieldInputPlaceholder__signUpPassword: 'Crie uma senha',
        formFieldAction__forgotPassword: 'Esqueci minha senha',
        formButtonPrimary: 'Continuar',
        backButton: 'Voltar',
        signIn: {
          start: {
            title: 'Boas-vindas de volta',
            subtitle: 'Entre para acessar seu convite',
            actionText: 'Ainda não tem acesso?',
            actionLink: 'Criar acesso',
          },
          password: {
            title: 'Digite sua senha',
            subtitle: 'Use a senha vinculada ao seu convite',
            actionLink: 'Usar outro método',
          },
        },
        signUp: {
          start: {
            title: 'Crie seu acesso',
            subtitle: 'Seu convite começa por aqui',
            actionText: 'Já tem uma conta?',
            actionLink: 'Entrar',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/user-portal"><Protected><UserPortalPage /></Protected></Route>
            <Route path="/admin"><Protected><AdminPage /></Protected></Route>
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() { return <WouterRouter base={basePath}><ClerkApp /></WouterRouter>; }

export default App;
