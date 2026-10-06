import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { firebase } from '../services/firebase';
import { business } from '../config/business';
import { products as seedProducts, faqs } from '../data/catalog';
import type { Product } from '../types';
import type { SiteContent, StoreSettings, StoreProduct, SkuRecord } from '../domain/models';
export const defaultContent: SiteContent = { announcement: 'A little water. A little care. A whole new ritual.', heroEyebrow: 'LESS EFFORT. MORE YOU.', heroTitle: 'Goodbye makeup.', heroAccent: 'Hello, soft skin.', heroDescription: 'A little warm water. One beautifully soft pad. Meet the everyday essential that makes taking it all off feel like a little act of self-care.', faqs };
interface SiteState { products: Product[]; settings: StoreSettings; content: SiteContent; loading: boolean; error: string }
const Context = createContext<SiteState>({ products: seedProducts, settings: business, content: defaultContent, loading: false, error: '' });
export function SiteProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(firebase ? [] : seedProducts);
  const [settings, setSettings] = useState(business); const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(Boolean(firebase)); const [error, setError] = useState('');
  useEffect(() => {
    if (!firebase) return;
    const db = firebase.db; let catalog: StoreProduct[] = []; let skus: SkuRecord[] = []; let catalogReady = false; let skusReady = false;
    const merge = () => { if (!catalogReady || !skusReady) return; setProducts(catalog.map(p => ({ ...p, variants: p.variants.map(v => ({ ...v, stock: skus.find(s => s.id === v.sku && s.active)?.stock ?? 0 })) }))); setLoading(false); };
    const fail = () => { setError('We could not load the live collection. Please check the store connection and try again.'); setLoading(false); };
    const listeners = [
      onSnapshot(query(collection(db, 'products'), where('active', '==', true)), snap => { catalog = snap.docs.map(d => ({ ...d.data(), id: d.id } as StoreProduct)); catalogReady = true; merge(); }, fail),
      onSnapshot(query(collection(db, 'skus'), where('active', '==', true)), snap => { skus = snap.docs.map(d => ({ ...d.data(), id: d.id } as SkuRecord)); skusReady = true; merge(); }, fail),
      onSnapshot(doc(db, 'settings', 'store'), snap => { if (snap.exists()) setSettings({ ...business, ...snap.data() }); }, fail),
      onSnapshot(doc(db, 'siteContent', 'home'), snap => { if (snap.exists()) setContent({ ...defaultContent, ...snap.data() } as SiteContent); }, fail),
    ];
    return () => listeners.forEach(unsubscribe => unsubscribe());
  }, []);
  return <Context.Provider value={{ products, settings, content, loading, error }}>{children}</Context.Provider>;
}
export const useSite = () => useContext(Context);
export function useCatalog() { const state = useSite(); return { ...state, getProduct: (id: string) => state.products.find(p => p.id === id || p.slug === id) }; }
export const useSettings = () => useSite().settings;
