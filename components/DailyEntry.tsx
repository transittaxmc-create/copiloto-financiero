import { useState } from 'react';
import { Home, MapPin, Coffee, ChevronDown } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DailyEntry() {
  const [platform, setPlatform] = useState('Uber');
  const [gross, setGross] = useState('');
  const [tips, setTips] = useState('');
  const [tolls, setTolls] = useState('');
  const [fee, setFee] = useState('');
  const [ref, setRef] = useState('');
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);

  const handlePickup = () => { setPickup({ name: 'Residencia', city: 'Lindenhurst', time: '4:43 PM' }); };
  const handleDropoff = () => { setDropoff({ name: 'Business', city: 'Copiague', time: '5:12 PM' }); };

  const handleSave = async () => {
    await supabase.from('trips').insert({
      platform_id: platform,
      earnings: parseFloat(gross) || 0,
      tips: parseFloat(tips) || 0,
      tolls: parseFloat(tolls) || 0,
      platform_fee: parseFloat(fee) || 0,
      pickup_time: pickup ? new Date().toISOString() : null,
      dropoff_time: dropoff ? new Date().toISOString() : null,
      status: 'pending'
    });
    setGross(''); setTips(''); setTolls(''); setFee(''); setRef('');
    setPickup(null); setDropoff(null);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white p-4 pb-24 font-sans">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Good evening, Miguel.</h1>
        <p className="text-yellow-500 text-sm">Sun, Sep 6 · 11:44 PM</p>
        <div className="flex items-center gap-2 text-gray-400 mt-1">
          <MapPin size={14} className="text-green-400" />
          <span className="text-sm truncate">West Granada Ave, Lindenhurst</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-[#1E293B] rounded-xl border border-gray-700 p-3 flex items-center justify-between">
          <span className="font-semibold">{platform}</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
        <button className="bg-transparent border border-yellow-500 text-yellow-500 px-4 rounded-xl flex items-center gap-2">
          <Coffee size={16} /> Break
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Gross fare</p>
          <input type="text" inputMode="decimal" placeholder="0.00" className="bg-transparent w-full outline-none" value={gross} onChange={(e) => setGross(e.target.value)} />
        </div>
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Ref / Invoice</p>
          <input type="text" placeholder="opcional" className="bg-transparent w-full outline-none placeholder-gray-500" value={ref} onChange={(e) => setRef(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={handlePickup} className="bg-green-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2">
          <MapPin size={18} /> Pickup now
        </button>
        <button onClick={handleDropoff} className="bg-blue-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2">
          <MapPin size={18} /> Dropoff now
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-xl p-3 border border-green-500/30 flex flex-col justify-between h-[60px] overflow-hidden">
          <div className="flex items-center gap-1 text-green-400 font-bold text-xs"><Home size={14} /> {pickup ? pickup.name : "Pendiente"}</div>
          <div className="text-xs text-gray-300 truncate">{pickup ? `${pickup.time} · ${pickup.city}` : "Toca Pickup"}</div>
        </div>
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700 flex flex-col justify-between h-[60px] overflow-hidden">
          <div className="flex items-center gap-1 text-gray-400 font-bold text-xs"><MapPin size={14} /> {dropoff ? dropoff.name : "Pendiente"}</div>
          <div className="text-xs text-gray-400 truncate">{dropoff ? `${dropoff.time} · ${dropoff.city}` : "Toca dropoff"}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Tips</p>
          <input type="text" inputMode="decimal" placeholder="0.00" className="bg-transparent w-full outline-none" value={tips} onChange={(e) => setTips(e.target.value)} />
        </div>
        <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Toll</p>
          <input type="text" inputMode="decimal" placeholder="0.00" className="bg-transparent w-full outline-none" value={tolls} onChange={(e) => setTolls(e.target.value)} />
        </div>
      </div>

      <div className="bg-[#1E293B] rounded-xl p-3 border border-gray-700 mb-6">
        <p className="text-xs text-gray-400 mb-1">Platform fee</p>
        <input type="text" inputMode="decimal" placeholder="0.00" className="bg-transparent w-full outline-none" value={fee} onChange={(e) => setFee(e.target.value)} />
      </div>

      <div className="flex justify-between items-end mb-6 bg-[#1E293B] p-4 rounded-xl">
        <div>
          <p className="text-xs text-gray-400">Net payout</p>
          <p className="text-3xl font-bold text-green-400">${((parseFloat(gross)||0) + (parseFloat(tips)||0) + (parseFloat(tolls)||0) - (parseFloat(fee)||0)).toFixed(2)}</p>
        </div>
        <div className="bg-white text-black p-3 rounded-xl text-right">
          <p className="text-xs text-gray-600">Gross income</p>
          <p className="text-2xl font-bold">${((parseFloat(gross)||0) + (parseFloat(tips)||0) + (parseFloat(tolls)||0)).toFixed(2)}</p>
        </div>
      </div>

      <button onClick={handleSave} className="w-full bg-green-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2">
        ✓ Guardar Trip
      </button>
    </div>
  );
}
