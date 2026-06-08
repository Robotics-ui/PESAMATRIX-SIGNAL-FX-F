import { Route, Switch } from 'wouter';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route component={Dashboard} />
    </Switch>
  );
}
