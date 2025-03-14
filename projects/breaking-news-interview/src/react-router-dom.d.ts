/**
 * Declaration file for react-router-dom
 * This is a temporary solution to bypass TypeScript errors when the module can't be installed
 */
declare module 'react-router-dom' {
  import * as React from 'react';

  export interface NavigateProps {
    to: string;
    replace?: boolean;
    state?: any;
  }

  export interface RouteProps {
    path?: string;
    element?: React.ReactNode;
    children?: React.ReactNode;
  }

  export interface RoutesProps {
    children?: React.ReactNode;
  }

  export interface BrowserRouterProps {
    basename?: string;
    children?: React.ReactNode;
  }

  export class BrowserRouter extends React.Component<BrowserRouterProps> {}
  export class Routes extends React.Component<RoutesProps> {}
  export class Route extends React.Component<RouteProps> {}
  export class Navigate extends React.Component<NavigateProps> {}

  export function useNavigate(): (to: string, options?: { replace?: boolean, state?: any }) => void;
  export function useParams<T = {}>(): T;
  export function useLocation(): { pathname: string, search: string, hash: string, state: any };
} 