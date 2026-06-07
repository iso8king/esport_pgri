<script>
  import { onMount } from "svelte";
  import Navbar from "../lib/Navbar.svelte";
  import Footer from "../lib/Footer.svelte";
  let sliderContainer; 

  const defaultAboutText = "Images, Videos, PDFs and audio files are supported. Create multi impressions and dynamic directs from the app. Take photos with the mobile app and save them in a note.";

  let settings = { 
    heroImage: null,
    aboutText: defaultAboutText,
    aboutImage: null,
    gallery: []
  };

  onMount(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          settings = json.data;
        }
      }
    } catch (e) {
      console.error("Error fetching dashboard settings:", e);
    }
  });

  $: itemsToRender = settings.gallery && settings.gallery.length > 0 
    ? settings.gallery 
    : [
        { id: 1, isDefault: true, title: 'Gambar 1', description: 'Deskripsi singkat mengenai foto kegiatan turnamen PGRI.' },
        { id: 2, isDefault: true, title: 'Gambar 2', description: 'Keseruan peserta dalam turnamen E-sport PGRI.' },
        { id: 3, isDefault: true, title: 'Gambar 3', description: 'Sesi latihan rutin tim E-sport PGRI.' },
        { id: 4, isDefault: true, title: 'Gambar 4', description: 'Penyerahan trofi juara utama turnamen.' },
        { id: 5, isDefault: true, title: 'Gambar 5', description: 'Foto bersama tim E-sport PGRI.' }       
      ];

  function slideLeft() {
    if (sliderContainer) {
      if (sliderContainer.scrollLeft <= 10) {
        sliderContainer.scrollTo({ left: sliderContainer.scrollWidth, behavior: 'smooth' });
      } else {
        sliderContainer.scrollBy({ left: -sliderContainer.clientWidth, behavior: 'smooth' });
      }
    }
  }

  function slideRight() {
    if (sliderContainer) {
      const maxScroll = sliderContainer.scrollWidth - sliderContainer.clientWidth;
      
      if (sliderContainer.scrollLeft >= maxScroll - 10) {
        sliderContainer.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        sliderContainer.scrollBy({ left: sliderContainer.clientWidth, behavior: 'smooth' });
      }
    }
  }

  function scrollToSection(id) {
    const elemen = document.getElementById(id);
    if (elemen) {
      elemen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
</script>
<style>
  .hilangkan-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hilangkan-scrollbar {
    -ms-overflow-style: none; 
    scrollbar-width: none;  
  }
</style>

<nav>
  <Navbar />
</nav>

<div class="w-full overflow-visible font-sans">

  <section id="home" class="relative w-full min-h-[85vh] bg-gradient-to-r from-[#0b355b] to-[#1a5c8c] px-4 sm:px-6 md:px-8 pt-28 pb-16 sm:pt-32 sm:pb-20 md:py-24 flex items-center">   
    <div class="absolute overflow-hidden top-0 right-0 w-full h-full flex items-center justify-center z-0 opacity-20 pointer-events-none">
      <img src="src/assets/bg-bawah.svg" alt="Background Waves" class="min-w-[1000px] w-full h-full object-cover" />        
    </div>    
    <div class="max-w-[1400px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center relative z-10">
      
      <div class="text-center md:text-left text-white flex flex-col items-center md:items-start">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
          E-Sports <br class="hidden md:block"/><span class="text-blue-200">Ekstrakurikuler</span>
        </h1>
        <p class="text-blue-100/90 text-sm sm:text-base md:text-lg max-w-md leading-relaxed mb-8 font-normal">
          Selamat datang di website resmi Ekstrakurikuler E-Sports SMKS PGRI 1 Tangerang. Tempat mengasah minat, strategi, dan sportivitas atlet digital masa depan.
        </p>
        <div class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button on:click={() => scrollToSection('about')} class="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-blue-50 text-[#0b355b] font-bold rounded-lg shadow-lg hover:shadow-white/10 active:scale-[0.98] transition-all duration-300 text-center cursor-pointer text-sm sm:text-base">
            Jelajahi Profil
          </button>
        </div>
      </div>

      <div class="w-full aspect-video md:aspect-[4/3] bg-[#0c2e4e] rounded-2xl shadow-2xl border-4 border-white/10 flex items-center justify-center overflow-hidden max-w-xl mx-auto md:max-w-none transform hover:scale-[1.02] transition-all duration-500 shadow-blue-950/50">
        <img src={settings.heroImage ? `/assets/${settings.heroImage}` : "src/assets/bglogin.jpg"} alt="Hero E-Sports" class="w-full h-full object-cover" />
      </div>

    </div>
  </section>

  <section id="about" class="relative overflow-hidden w-full min-h-[85vh] bg-white px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-28 scroll-mt-10 flex items-center">
    <div class="absolute -top-24 -left-36 w-full h-full flex items-start justify-end z-0 opacity-20 pointer-events-none">
      <svg viewBox="0 0 800 800" class="w-full h-full"><g stroke-width="1" stroke="hsl(230, 55%, 40%)" fill="none" stroke-linecap="round">
        <path d="M121.41 103.4Q130.86 105.39 140.31 107.66 149.76 110.14 159.21 112.75 168.66 115.4 178.11 118.01 187.57 120.48 197.02 122.74 206.47 124.71 215.92 126.32 225.37 127.52 234.82 128.27 244.27 128.55 253.72 128.35 263.17 127.67 272.62 126.54 282.07 124.99 291.52 123.08 300.97 120.86 310.42 118.42 319.87 115.83 329.32 113.18 338.77 110.56 348.22 108.05 357.67 105.73 367.12 103.7 376.57 102 386.02 100.7 395.47 99.85 404.92 99.46 414.37 99.55 423.82 100.13 433.27 101.16 442.72 102.62 452.17 104.46 461.62 106.61 471.07 109.01 480.52 111.57 489.97 114.22 499.42 116.85 508.87 119.4 518.32 121.76 527.77 123.86 537.22 125.64 546.67 127.03 556.12 127.99 565.57 128.49 575.02 128.5 584.47 128.03 593.92 127.1 603.37 125.73 612.82 123.97 622.27 121.89 631.72 119.54 641.17 117 650.62 114.37 660.07 111.72 669.52 109.15 678.97 106.74 688.42 104.57 697.87 102.71 707.32 101.23 724.91 114.74 716.63 133.91 703.99 142.49 689.4 151.07 674.44 159.66 660.74 168.24 649.77 176.82 642.74 185.41 640.41 193.99 643.02 202.57 650.3 211.16 661.46 219.74 675.28 228.32 690.26 236.91 704.78 245.49 717.26 254.07 726.35 262.66 731.05 271.24 730.86 279.82 725.8 288.41 716.42 296.99 703.74 305.57 689.12 314.16 674.17 322.74 660.5 331.32 649.6 339.91 642.89 357.07 650.48 374.24 661.7 382.82 675.55 391.41 690.54 399.99 705.04 408.57 717.47 417.16 726.48 425.74 731.09 434.32 730.81 442.91 725.67 451.49 716.21 460.07 703.48 468.66 688.84 477.24 673.9 485.82 660.27 494.41 649.43 502.99 642.57 511.57 640.42 520.16 643.21 528.74 650.66 537.32 661.93 545.91 675.83 554.49 690.82 563.07 705.29 571.66 717.67 580.24 726.61 588.82 731.13 597.41 730.76 605.99 725.53 614.57 716 623.16 703.22 631.74 688.56 640.32 673.63 648.91 664.85 650.45 656.07 653.17 647.29 656.99 638.51 661.76 629.73 667.34 620.95 673.54 612.17 680.15 603.39 686.95 594.61 693.72 585.83 700.24 577.05 706.29 568.27 711.66 559.49 716.18 550.71 719.69 541.93 722.09 533.15 723.3 524.37 723.26 515.59 721.99 506.81 719.52 498.03 715.95 489.25 711.37 480.47 705.96 471.69 699.88 462.91 693.35 454.13 686.57 445.35 679.77 436.57 673.17 427.79 667.01 419.01 661.47 410.23 656.74 401.45 652.99 392.67 650.33 383.89 648.86 375.11 648.61 366.33 649.61 357.55 651.81 348.77 655.15 339.99 659.51 331.21 664.75 322.43 670.7 313.65 677.15 304.87 683.9 296.09 690.71 287.31 697.37 278.53 703.65 269.75 709.35 260.97 714.27 252.19 718.25 243.41 721.16 234.63 722.91 225.85 723.43 217.07 722.71 208.29 720.77 199.51 717.68 190.73 713.54 181.95 708.48 173.17 702.67 164.39 696.32 155.61 689.62 146.83 682.8 138.05 676.09 129.27 669.7 117.48 656.96 117.17 641.39 119.53 632.72 121.29 624.04 121.87 606.68 119.84 589.33 117.56 580.65 114.89 571.97 112.12 563.3 109.56 554.62 106.53 537.26 105.98 519.91 107.25 511.23 109.25 502.56 111.76 493.88 114.52 485.2 117.22 476.52 119.57 467.85 121.81 450.49 121.46 433.14 119.8 424.46 117.51 415.78 114.83 407.1 112.07 398.43 109.51 389.75 107.44 381.07 106.04 363.72 107.28 346.36 109.29 337.69 111.81 329.01 114.57 320.33 117.27 311.65 119.61 302.98 121.34 294.3 121.86 276.95 119.76 259.59 117.46 250.91 114.78 242.24 112.02 233.56 109.47 224.88 106.5 207.53 106.02 190.17 107.31 181.49 109.34 172.82 111.86 164.14 114.62 155.46 117.32 146.79 119.65 138.11 121.83 120.75 121.41 103.4" stroke-dasharray="19 32" transform="rotate(0, 400, 400)" opacity="0.03"></path></g></svg>
    </div>
    <div class="max-w-[1400px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
      
      <div class="text-center md:text-left">
        <div class="relative inline-block mb-6">
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0b355b]">
            About Us
          </h2>
          <div class="h-1.5 w-30 bg-[#1a5c8c] rounded-full mt-4 mx-auto md:mx-0"></div>
        </div>
        
        <p class="text-gray-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto md:mx-0 font-normal">
          {settings.aboutText || defaultAboutText}
        </p>

       <!-- // feature grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left">
          <div class="p-5 rounded-2xl bg-[#f8fafc] border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5 group">
            <h4 class="font-bold text-[#0b355b] text-sm mb-1.5">Turnamen Rutin</h4>
            <p class="text-xs text-gray-500 leading-relaxed font-normal">Berpartisipasi aktif dalam turnamen resmi antar-pelajar tingkat regional & nasional.</p>
          </div>
          <div class="p-5 rounded-2xl bg-[#f8fafc] border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5 group">
            <h4 class="font-bold text-[#0b355b] text-sm mb-1.5">Fasilitas Lengkap</h4>
            <p class="text-xs text-gray-500 leading-relaxed font-normal">Latihan terstruktur dengan dukungan perangkat berspesifikasi mumpuni.</p>
          </div>
          <div class="p-5 rounded-2xl bg-[#f8fafc] border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/5 group">
            <h4 class="font-bold text-[#0b355b] text-sm mb-1.5">Keseimbangan</h4>
            <p class="text-xs text-gray-500 leading-relaxed font-normal">Menyeimbangkan prestasi akademik siswa dengan pembinaan disiplin atlet digital.</p>
          </div>
        </div>
      </div>

      <div class="w-full aspect-video md:aspect-[4/3] bg-slate-100 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center overflow-hidden max-w-xl mx-auto md:max-w-none transform hover:scale-[1.02] transition-all duration-500 shadow-slate-200/40">
        <img src={settings.aboutImage ? `/assets/${settings.aboutImage}` : "src/assets/bglogin.jpg"} alt="Background About" class="w-full h-full object-cover"/>
      </div>

    </div>
  </section>
  <section id="gallery" class="relative w-full min-h-[85vh] bg-gradient-to-r from-[#0b355b] to-[#1a5c8c] px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-28 scroll-mt-24 flex items-center">
    <div class="absolute overflow-hidden top-0 right-0 w-full h-full flex items-center justify-center z-0 opacity-20 pointer-events-none">
      <img src="src/assets/bg-bawah.svg" alt="Background Waves" class="min-w-[1000px] w-full h-full object-cover" />        
    </div>
    <div class="max-w-[1400px] mx-auto w-full flex flex-col items-center relative z-10">
      
      <div class="text-center mb-12 md:mb-16">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
          Galeri Foto
        </h2>
        <div class="h-1.5 w-16 bg-white rounded-full mt-4 mx-auto"></div>
      </div>

      <div class="relative w-full max-w-6xl flex items-center justify-center px-4 sm:px-8 md:px-12">
        
        <button on:click={slideLeft} class="absolute left-0 sm:-left-4 md:-left-8 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl transition-all duration-300 group cursor-pointer active:scale-95">
          <svg class="w-6 h-6 text-white group-hover:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <div 
          bind:this={sliderContainer}
          class="w-full flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth hilangkan-scrollbar py-4"
        >
          {#each itemsToRender as item}
            <div class="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] shrink-0 snap-center aspect-[4/3] rounded-2xl shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer bg-[#0c2e4e]">
              {#if item.isDefault}
                <div class="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0e3b61] to-[#175283] text-center select-none group-hover:scale-105 transition-all duration-500">
                  <div class="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    <svg class="w-7 h-7 text-blue-200 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <span class="text-white font-bold text-lg mb-1">{item.title}</span>
                  <span class="text-blue-200/70 text-xs px-4 leading-relaxed line-clamp-2">{item.description}</span>
                </div>
              {:else}
                <img src={`/assets/${item.image}`} alt={item.description || item.title || "Foto Galeri"} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                
                <!-- Hover Overlay dengan Deskripsi -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 text-left select-none">
                  <h4 class="text-white font-bold text-base sm:text-lg mb-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                    {item.title || "Gallery Kita"}
                  </h4>
                  <p class="text-gray-300 text-xs leading-relaxed font-light transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                    {item.description || "Tidak ada deskripsi untuk foto ini."}
                  </p>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <button on:click={slideRight} class="absolute right-0 sm:-right-4 md:-right-8 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl transition-all duration-300 group cursor-pointer active:scale-95">
          <svg class="w-6 h-6 text-white group-hover:text-blue-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

      </div>

    </div>
  </section>



</div>

<footer>
  <Footer />
</footer>