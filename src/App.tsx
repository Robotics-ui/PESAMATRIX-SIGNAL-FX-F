import { Route, Switch } from 'wouter';
import Dashboard from './pages/Dashboard';
import MediaLibrary from './pages/MediaLibrary';
import Contacts from './pages/Contacts';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/media" component={MediaLibrary} />
      <Route path="/contacts" component={Contacts} />
      <Route component={Dashboard} />
    </Switch>
  );
}
