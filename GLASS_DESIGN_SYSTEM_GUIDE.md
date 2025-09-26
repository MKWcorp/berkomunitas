## 🎨 Glass Design System - Panduan Penggunaan

### 📝 **Konsep Utama**

Glass Design System yang kita buat menggunakan 3 pendekatan utama:

1. **GlassLayout** - Layout wrapper full screen otomatis
2. **Responsive Hooks** - Otomatis responsive di semua device  
3. **Component Library** - Komponen siap pakai dengan glass effect

---

### 🚀 **Cara Implementasi Per Halaman**

#### **Method 1: Langsung Import dan Wrap**
```jsx
import GlassLayout, { GlassContainer, GlassCard, GlassButton } from '@/components/GlassLayout';
import { useResponsive } from '@/hooks/useGlassTheme';

export default function MyPage() {
  const { responsive, isMobile } = useResponsive();
  
  return (
    <GlassLayout variant="admin" showAnimatedBg={true}>
      {/* Content otomatis dapat background glass full screen */}
      <GlassContainer className="p-6">
        <h1>Halaman dengan Glass Design</h1>
      </GlassContainer>
    </GlassLayout>
  );
}
```

#### **Method 2: Gunakan HOC untuk Auto-wrap**
```jsx
import { withGlassLayout } from '@/hooks/useGlassTheme';

function MyPage() {
  return (
    <div>
      <h1>Content halaman</h1>
      {/* Otomatis terbungkus glass layout */}
    </div>
  );
}

// Export dengan HOC
export default withGlassLayout(MyPage, { 
  variant: 'admin',
  showAnimatedBg: true 
});
```

---

### 🎯 **Komponen Glass Siap Pakai**

#### **1. GlassContainer - Container Fleksibel**
```jsx
<GlassContainer 
  blur="xl"           // sm, md, lg, xl, 2xl, 3xl
  opacity="10"        // 5, 10, 15, 20, 30
  rounded="2xl"       // xl, 2xl, 3xl
  shadow="2xl"        // md, lg, xl, 2xl
  border={true}       // true/false
  hover={true}        // animasi hover
  padding="6"         // 4, 6, 8
>
  Content here
</GlassContainer>
```

#### **2. GlassCard - Card dengan Icon & Title**
```jsx
<GlassCard 
  title="Total Users"
  subtitle="Active members"
  icon={UserIcon}
  gradient="blue"     // blue, green, purple, red, yellow, pink
  className="p-4"
>
  <div className="text-2xl font-bold">1,234</div>
</GlassCard>
```

#### **3. GlassButton - Button dengan Glass Effect**
```jsx
<GlassButton 
  variant="primary"   // primary, secondary, success, danger, warning
  size="md"          // sm, md, lg
  onClick={handleClick}
>
  Click Me
</GlassButton>
```

---

### 📱 **Responsive Otomatis**

#### **useResponsive Hook**
```jsx
const { 
  responsive, 
  isMobile, 
  isTablet, 
  isDesktop,
  getResponsiveValue 
} = useResponsive();

// Otomatis responsive classes
<div className={`${responsive.container.width} ${responsive.padding}`}>
  <h1 className={responsive.text.title}>
    {getResponsiveValue('Mobile Title', 'Tablet Title', 'Desktop Title')}
  </h1>
</div>

// Grid responsive otomatis
<div className={`grid ${responsive.grid.cols} ${responsive.grid.gap}`}>
  {items.map(item => <GlassCard key={item.id} {...item} />)}
</div>
```

---

### 🎨 **Variant Themes Available**

```jsx
// Background variants
<GlassLayout variant="default" />   // Blue gradient
<GlassLayout variant="admin" />     // Gray-blue gradient  
<GlassLayout variant="user" />      // Green gradient
<GlassLayout variant="dark" />      // Dark theme
<GlassLayout variant="sunset" />    // Orange-pink gradient
<GlassLayout variant="ocean" />     // Cyan-blue gradient
```

---

### ⚡ **Performance Optimizations**

#### **useGlassEffects Hook**
```jsx
const { effectsEnabled, getGlassClasses, glassConfig } = useGlassEffects();

// Otomatis disable blur di mobile yang tidak support
const containerClasses = getGlassClasses({
  blur: glassConfig.blur,
  opacity: glassConfig.opacity,
  shadow: glassConfig.shadow
});
```

---

### 💡 **Best Practices**

#### **1. Struktur Halaman Recommended:**
```jsx
export default function MyPage() {
  const { responsive } = useResponsive();
  
  return (
    <GlassLayout variant="admin">
      <div className="space-y-6">
        {/* Header */}
        <GlassContainer className="p-6">
          <h1 className={responsive.text.title}>Page Title</h1>
        </GlassContainer>
        
        {/* Stats Cards */}
        <div className={`grid ${responsive.grid.cols} ${responsive.grid.gap}`}>
          <GlassCard title="Stat 1" gradient="blue">Content</GlassCard>
          <GlassCard title="Stat 2" gradient="green">Content</GlassCard>
        </div>
        
        {/* Main Content */}
        <GlassContainer className="p-8">
          Main content area
        </GlassContainer>
      </div>
    </GlassLayout>
  );
}
```

#### **2. Import Patterns:**
```jsx
// Import semua yang dibutuhkan sekaligus
import GlassLayout, { 
  GlassContainer, 
  GlassCard, 
  GlassButton 
} from '@/components/GlassLayout';

import { 
  useResponsive, 
  useGlassEffects,
  GlassResponsiveContainer 
} from '@/hooks/useGlassTheme';
```

---

### 🔧 **Customization Examples**

#### **Custom Glass Container:**
```jsx
<GlassContainer 
  className="hover:scale-105 transition-transform"
  blur="2xl"
  opacity="5" 
  shadow="3xl"
  border={false}
  hover={true}
>
  Custom styling
</GlassContainer>
```

#### **Responsive Glass Cards:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {data.map(item => (
    <GlassCard 
      key={item.id}
      title={item.title}
      gradient={item.color}
      className={`
        ${isMobile ? 'p-4' : 'p-6'}
        hover:scale-105 transition-all duration-300
      `}
    >
      {item.content}
    </GlassCard>
  ))}
</div>
```

---

### 📋 **Quick Migration Checklist**

**Untuk mengubah halaman existing:**

✅ Import `GlassLayout` dan hook `useResponsive`  
✅ Wrap return dengan `<GlassLayout variant="admin">`  
✅ Replace div containers dengan `<GlassContainer>`  
✅ Replace buttons dengan `<GlassButton>`  
✅ Replace cards dengan `<GlassCard>`  
✅ Update responsive classes dengan `responsive.*`  
✅ Test di mobile, tablet, desktop  

---

### 🎉 **Hasil Akhir**

Dengan sistem ini, setiap halaman **otomatis mendapat:**

- ✨ **Full screen glass background** dengan animated orbs
- 📱 **Responsive design** otomatis untuk semua device
- 🎨 **Consistent glass styling** di semua komponen  
- ⚡ **Performance optimized** untuk mobile
- 🔧 **Easy customization** dengan props
- 🚀 **Developer friendly** - sekali setup, pakai di mana saja

**Sekarang setiap import GlassLayout = Instant beautiful glass design!** 🎯
