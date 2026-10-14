"use client";
import { useState } from "react";

export default function AbonnementPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-[#0a1930] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-black text-center">
          <span className="text-white">Afri</span><span className="text-orange-500">Flow</span>
        </h1>
        <p className="text-center text-gray-400 mt-2">by MB Mustapha - Pour PME Afrique Centrale</p>

        {/* Prix */}
        <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-center">
          <h2 className="text-5xl font-black">10 000 FCFA</h2>
          <p className="text-xl font-bold opacity-90">/ mois</p>
          <p className="mt-2 text-sm">Factures illimitées • Stock • Clients • Rapports FCFA</p>
        </div>

        {/* Paiement MoMo Manuel */}
        <div className="mt-8 bg-slate-800 rounded-2xl p-6 border-2 border-orange-500">
          <h3 className="text-2xl font-bold text-orange-400">📱 Payer par Mobile Money</h3>

          <div className="mt-6 space-y-4">
            <div className="bg-black rounded-xl p-4">
              <p className="text-gray-400 text-sm">MTN Mobile Money</p>
              <p className="text-2xl font-mono font-bold text-green-400">6XX XX XX XX</p>
              <p className="text-sm">Nom: MUSTAPHA M.</p>
            </div>

            <div className="bg-black rounded-xl p-4">
              <p className="text-gray-400 text-sm">Orange Money</p>
              <p className="text-2xl font-mono font-bold text-orange-400">6XX XX XX XX</p>
              <p className="text-sm">Nom: MUSTAPHA M.</p>
            </div>

            <div className="bg-blue-900/50 rounded-xl p-4 border border-blue-500">
              <p className="font-bold">Étapes:</p>
              <ol className="list-decimal ml-5 mt-2 space-y-1 text-sm">
                <li>Envoie 10 000 FCFA à l'un des numéros</li>
                <li>Fais capture d'écran du message MoMo</li>
                <li>Envoie capture + ton email sur WhatsApp</li>
                <li>Activation en 5 minutes!</li>
              </ol>
            </div>

            <input
              type="email"
              placeholder="Ton email AfriFlow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 text-white"
            />

            <a
              href={`https://wa.me/237640633034?text=Salam Bouba! J'ai payé AfriFlow 10000FCFA. Mon email: ${email}. Voici ma preuve:`}
              target="_blank"
              className="block w-full bg-green-500 hover:bg-green-600 text-black font-black text-center py-4 rounded-xl text-lg"
            >
              📲 Envoyer preuve sur WhatsApp
            </a>

            <p className="text-center text-xs text-gray-500">
              Après vérification, ton abonnement sera activé pour 30 jours
            </p>
          </div>
        </div>

        {/* Essai Gratuit */}
        <div className="mt-6 bg-slate-800 rounded-2xl p-6 text-center border border-green-500">
          <h3 className="font-bold text-green-400">🎁 Pas sûr? Essai Gratuit 7 Jours</h3>
          <p className="text-sm text-gray-400 mt-1">Sans payer, teste tout AfriFlow</p>
          <button className="mt-4 w-full bg-white text-black font-bold py-3 rounded-xl">
            Activer Essai Gratuit
          </button>
        </div>

        <p className="text-center mt-8 text-xs text-gray-600">
          Garoua • Cameroun • Tchad • Bénin • Togo • Afrique Centrale
        </p>
      </div>
    </div>
  );
}