import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export const ClientHomePage: React.FC = () => {
   const { user } = useAuth();
   
   return (
       <div className="p-8 max-w-4xl mx-auto w-full">
           <h1 className="text-3xl font-bold mb-6">Välkommen, {user?.name}</h1>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-border bg-sidebar shadow-sm">
                 <h2 className="text-lg font-semibold mb-2">Dagens Assistans</h2>
                 <p className="text-muted-foreground text-sm mb-4">Här kommer du kunna se vem som arbetar hos dig idag och när passet börjar.</p>
                 <div className="p-4 rounded-lg bg-secondary text-sm flex items-center justify-center text-muted-foreground border border-border border-dashed">
                     Inget schema tillgängligt just nu
                 </div>
              </div>
              <div className="p-6 rounded-xl border border-border bg-sidebar shadow-sm">
                 <h2 className="text-lg font-semibold mb-2">Meddelanden</h2>
                 <p className="text-muted-foreground text-sm mb-4">Om du behöver nå din samordnare eller chef kan du skicka ett säkert meddelande i inkorgen.</p>
                 <a href="/inbox" className="inline-block mt-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">Gå till Inkorgen</a>
              </div>
           </div>
       </div>
   );
};
