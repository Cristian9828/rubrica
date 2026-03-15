import {
  Briefcase, Building2, Home, Users, Star, Heart, Phone, Mail,
  Globe, MapPin, Folder, Layers, Archive, BookOpen, FileText,
  Laptop, Coffee, Zap, ShoppingBag, Car, Plane, Music,
  Camera, Wrench, Leaf, Flame, Diamond, Shield, Rocket, Smile,
} from 'lucide-vue-next';
import type { Component } from 'vue';

export const SECTION_ICONS: { name: string; component: Component }[] = [
  { name: 'Briefcase', component: Briefcase },
  { name: 'Building2', component: Building2 },
  { name: 'Home', component: Home },
  { name: 'Users', component: Users },
  { name: 'Star', component: Star },
  { name: 'Heart', component: Heart },
  { name: 'Phone', component: Phone },
  { name: 'Mail', component: Mail },
  { name: 'Globe', component: Globe },
  { name: 'MapPin', component: MapPin },
  { name: 'Folder', component: Folder },
  { name: 'Layers', component: Layers },
  { name: 'Archive', component: Archive },
  { name: 'BookOpen', component: BookOpen },
  { name: 'FileText', component: FileText },
  { name: 'Laptop', component: Laptop },
  { name: 'Coffee', component: Coffee },
  { name: 'Zap', component: Zap },
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'Car', component: Car },
  { name: 'Plane', component: Plane },
  { name: 'Music', component: Music },
  { name: 'Camera', component: Camera },
  { name: 'Wrench', component: Wrench },
  { name: 'Leaf', component: Leaf },
  { name: 'Flame', component: Flame },
  { name: 'Diamond', component: Diamond },
  { name: 'Shield', component: Shield },
  { name: 'Rocket', component: Rocket },
  { name: 'Smile', component: Smile },
];

export const ICON_MAP: Record<string, Component> = Object.fromEntries(
  SECTION_ICONS.map((i) => [i.name, i.component])
);

export function getIconComponent(name: string | null): Component | null {
  return name ? (ICON_MAP[name] ?? null) : null;
}
