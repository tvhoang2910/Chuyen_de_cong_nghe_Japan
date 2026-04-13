import { Component, type ReactNode } from 'react';

interface Props {
 children: ReactNode;
 fallback?: ReactNode;
}

interface State {
 hasError: boolean;
 error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props);
 this.state = { hasError: false };
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
 console.error('[ErrorBoundary]', error, errorInfo);
 }

 render() {
 if (this.state.hasError) {
 if (this.props.fallback) {
 return this.props.fallback;
 }
 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
 <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 max-w-md w-full text-center">
 <div className="text-5xl mb-4">!</div>
 <h1 className="text-xl font-bold text-slate-900 mb-2">Da xay ra loi</h1>
 <p className="text-slate-600 mb-6 text-sm">
 Da co loi khong mong muon xay ra. Vui long tai lai trang.
 </p>
 <button
 type="button"
 onClick={() => {
 this.setState({ hasError: false });
 window.location.reload();
 }}
 className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
 >
 Tai lai trang
 </button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
