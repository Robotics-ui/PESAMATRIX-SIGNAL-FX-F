import { Phone, MessageCircle, Clock, Shield, ChevronRight, Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import DashboardLayout from '../layouts/DashboardLayout';

const PHONE_NUMBERS = [
  { label: 'Primary Line', number: '+254717434943', display: '+254 717 434 943' },
  { label: 'Secondary Line', number: '+254781585319', display: '+254 781 585 319' },
];

const WHATSAPP_NUMBER = '+254717434943';

export default function Contacts() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=Hello%2C%20I%20need%20support%20with%20PMATRIX.`;

  return (
    <DashboardLayout>
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Contact Support</h1>
        <p className="text-sm text-zinc-400 mt-1">Reach the PMATRIX team for technical support, billing inquiries, or platform assistance.</p>
      </div>

      {/* Main contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone Numbers Card */}
        <Card className="bg-[#0c0c0e]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                <Phone className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-base text-zinc-100">Phone Support</CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">Direct call access to our team</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {PHONE_NUMBERS.map(({ label, number, display }) => (
              <div
                key={number}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 group hover:border-purple-500/30 transition-colors"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">{label}</p>
                  <p className="font-mono font-bold text-zinc-100 mt-0.5">{display}</p>
                </div>
                <a
                  href={`tel:${number}`}
                  className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* WhatsApp Card */}
        <Card className="bg-[#0c0c0e]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base text-zinc-100">WhatsApp Support</CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">Instant messaging with our support team</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-emerald-900/10 border border-emerald-500/20 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="success">Recommended</Badge>
              </div>
              <p className="font-mono font-bold text-zinc-100 text-lg mt-2">{PHONE_NUMBERS[0].display}</p>
              <p className="text-xs text-zinc-500 mt-1">Typically responds within minutes</p>
            </div>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="success" className="w-full gap-2">
                <MessageCircle className="h-4 w-4" />
                Open WhatsApp Chat
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Support Hours & Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0c0c0e]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-purple-400" />
              <p className="text-sm font-semibold text-zinc-200">Support Hours</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Mon – Fri</span>
                <span className="text-zinc-300 font-medium">8:00 AM – 8:00 PM</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Saturday</span>
                <span className="text-zinc-300 font-medium">9:00 AM – 5:00 PM</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Sunday</span>
                <span className="text-zinc-300 font-medium">Emergency only</span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-wide">East Africa Time (EAT)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0c0e]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-purple-400" />
              <p className="text-sm font-semibold text-zinc-200">Priority Support</p>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">VIP and Premium members receive priority response times and dedicated account management.</p>
            <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Support team online
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0c0e]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Headphones className="h-5 w-5 text-purple-400" />
              <p className="text-sm font-semibold text-zinc-200">What We Help With</p>
            </div>
            <ul className="space-y-1.5">
              {['Account setup & MT5 connection', 'Signal subscription issues', 'Billing & M-Pesa payments', 'Technical platform errors'].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-zinc-400">
                  <ChevronRight className="h-3 w-3 text-purple-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Banner */}
      <Card className="bg-gradient-to-r from-purple-950/40 to-zinc-950 border-purple-500/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-zinc-100">Need immediate assistance?</p>
              <p className="text-xs text-zinc-400 mt-0.5">Our support team is standing by to help you with any platform issues.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a href={`tel:${PHONE_NUMBERS[0].number}`}>
                <Button variant="secondary" className="gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  Call Now
                </Button>
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="success" className="gap-2 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
