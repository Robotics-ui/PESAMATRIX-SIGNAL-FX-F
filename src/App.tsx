import { Route, Switch } from 'wouter';
import Login from './pages/Login';
import Register from './pages/Register';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Providers from './pages/Providers';
import Billing from './pages/Billing';
import TradeHistory from './pages/TradeHistory';
import MediaLibrary from './pages/MediaLibrary';
import AdminPanel from './pages/AdminPanel';
import Contacts from './pages/Contacts';

export default function App() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/change-password" component={ChangePassword} />
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/providers" component={Providers} />
      <Route path="/billing" component={Billing} />
      <Route path="/history" component={TradeHistory} />
      <Route path="/media" component={MediaLibrary} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/contacts" component={Contacts} />
      <Route component={Dashboard} />
    </Switch>
  );
}
