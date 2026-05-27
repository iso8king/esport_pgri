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
      const res = await fetch("http://localhost:9999/api/settings");
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
        { id: 1, isDefault: true, title: 'Gambar 1' },
        { id: 2, isDefault: true, title: 'Gambar 2' },
        { id: 3, isDefault: true, title: 'Gambar 3' },
        { id: 4, isDefault: true, title: 'Gambar 4' }
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

  <section id="home" class="relative w-full min-h-[80vh] bg-gradient-to-r from-[#0b355b] to-[#1a5c8c] px-4 sm:px-6 md:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 md:py-20 flex items-center">   
        <div class="absolute overflow-hidden top-0 right-0 w-full h-full flex items-center justify-center z-0 opacity-30 pointer-events-none">
          <img src="src/assets/bg-bawah.svg" alt="Background Waves" class="min-w-[1000px] w-full h-full object-cover" />        
        </div>    
        <div class="max-w-[1400px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
      
      <div class="text-center md:text-left text-white">
        <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
          Lorem Ipsum Dolor <br class="hidden md:block"/> Sit Amet
        </h1>
        <p class="text-blue-200 text-xs sm:text-sm md:text-base max-w-sm mx-auto md:mx-0">
          lorem ipsum dolor sit amet blabla tri inata
        </p>
      </div>

      <div class="w-full aspect-video md:aspect-[4/3] bg-[#cde0fb] rounded-sm shadow-xl flex items-center justify-center overflow-hidden max-w-xl mx-auto md:max-w-none">
      <img src={settings.heroImage ? `http://localhost:9999/assets/${settings.heroImage}` : "src/assets/bglogin.jpg"} alt="Background Login" class="w-full h-full object-cover rounded-sm"/>
        </div>

    </div>
  </section>

  <section id="about" class="relative overflow-hidden w-full min-h-[80vh] bg-white px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-24 scroll-mt-10 flex items-center">
    <div class="absolute -top-24 -left-36 w-full h-full flex items-start justify-end z-0 opacity-30 pointer-events-none">
      <svg  viewBox="0 0 800 800"><g stroke-width="1.5" stroke="hsl(230, 55%, 40%)" fill="none" stroke-linecap="round">
        <path d="M121.41 103.4Q130.86 105.39 140.31 107.66 149.76 110.14 159.21 112.75 168.66 115.4 178.11 118.01 187.57 120.48 197.02 122.74 206.47 124.71 215.92 126.32 225.37 127.52 234.82 128.27 244.27 128.55 253.72 128.35 263.17 127.67 272.62 126.54 282.07 124.99 291.52 123.08 300.97 120.86 310.42 118.42 319.87 115.83 329.32 113.18 338.77 110.56 348.22 108.05 357.67 105.73 367.12 103.7 376.57 102 386.02 100.7 395.47 99.85 404.92 99.46 414.37 99.55 423.82 100.13 433.27 101.16 442.72 102.62 452.17 104.46 461.62 106.61 471.07 109.01 480.52 111.57 489.97 114.22 499.42 116.85 508.87 119.4 518.32 121.76 527.77 123.86 537.22 125.64 546.67 127.03 556.12 127.99 565.57 128.49 575.02 128.5 584.47 128.03 593.92 127.1 603.37 125.73 612.82 123.97 622.27 121.89 631.72 119.54 641.17 117 650.62 114.37 660.07 111.72 669.52 109.15 678.97 106.74 688.42 104.57 697.87 102.71 707.32 101.23 724.91 114.74 716.63 133.91 703.99 142.49 689.4 151.07 674.44 159.66 660.74 168.24 649.77 176.82 642.74 185.41 640.41 193.99 643.02 202.57 650.3 211.16 661.46 219.74 675.28 228.32 690.26 236.91 704.78 245.49 717.26 254.07 726.35 262.66 731.05 271.24 730.86 279.82 725.8 288.41 716.42 296.99 703.74 305.57 689.12 314.16 674.17 322.74 660.5 331.32 649.6 339.91 642.89 357.07 650.48 374.24 661.7 382.82 675.55 391.41 690.54 399.99 705.04 408.57 717.47 417.16 726.48 425.74 731.09 434.32 730.81 442.91 725.67 451.49 716.21 460.07 703.48 468.66 688.84 477.24 673.9 485.82 660.27 494.41 649.43 502.99 642.57 511.57 640.42 520.16 643.21 528.74 650.66 537.32 661.93 545.91 675.83 554.49 690.82 563.07 705.29 571.66 717.67 580.24 726.61 588.82 731.13 597.41 730.76 605.99 725.53 614.57 716 623.16 703.22 631.74 688.56 640.32 673.63 648.91 664.85 650.45 656.07 653.17 647.29 656.99 638.51 661.76 629.73 667.34 620.95 673.54 612.17 680.15 603.39 686.95 594.61 693.72 585.83 700.24 577.05 706.29 568.27 711.66 559.49 716.18 550.71 719.69 541.93 722.09 533.15 723.3 524.37 723.26 515.59 721.99 506.81 719.52 498.03 715.95 489.25 711.37 480.47 705.96 471.69 699.88 462.91 693.35 454.13 686.57 445.35 679.77 436.57 673.17 427.79 667.01 419.01 661.47 410.23 656.74 401.45 652.99 392.67 650.33 383.89 648.86 375.11 648.61 366.33 649.61 357.55 651.81 348.77 655.15 339.99 659.51 331.21 664.75 322.43 670.7 313.65 677.15 304.87 683.9 296.09 690.71 287.31 697.37 278.53 703.65 269.75 709.35 260.97 714.27 252.19 718.25 243.41 721.16 234.63 722.91 225.85 723.43 217.07 722.71 208.29 720.77 199.51 717.68 190.73 713.54 181.95 708.48 173.17 702.67 164.39 696.32 155.61 689.62 146.83 682.8 138.05 676.09 129.27 669.7 117.48 656.96 117.17 641.39 119.53 632.72 121.29 624.04 121.87 606.68 119.84 589.33 117.56 580.65 114.89 571.97 112.12 563.3 109.56 554.62 106.53 537.26 105.98 519.91 107.25 511.23 109.25 502.56 111.76 493.88 114.52 485.2 117.22 476.52 119.57 467.85 121.81 450.49 121.46 433.14 119.8 424.46 117.51 415.78 114.83 407.1 112.07 398.43 109.51 389.75 107.44 381.07 106.04 363.72 107.28 346.36 109.29 337.69 111.81 329.01 114.57 320.33 117.27 311.65 119.61 302.98 121.34 294.3 121.86 276.95 119.76 259.59 117.46 250.91 114.78 242.24 112.02 233.56 109.47 224.88 106.5 207.53 106.02 190.17 107.31 181.49 109.34 172.82 111.86 164.14 114.62 155.46 117.32 146.79 119.65 138.11 121.83 120.75 121.41 103.4" stroke-dasharray="19 32" transform="rotate(0, 400, 400)" opacity="0.05"></path></g></svg> </div>
    <div class="max-w-[1400px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
      
      <div class="text-center md:text-left">
        <div class="relative inline-block mb-6">
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0b355b] relative z-10">
            About Us
          </h2>
          <div class="absolute -top-6 sm:-top-8 md:-top-12 -left-6 sm:-left-8 md:-left-20 w-full h-full opacity-60" >
            <svg class="w-[180px] sm:w-[260px] md:w-[400px] h-auto" viewBox="0 0 800 400"><path d="M112.10762023925781,257.39910888671875C149.56053436279296,233.73094757080077,176.23317581176758,181.24664596557616,241.25559997558594,175.78475952148438C306.2780241394043,170.3228730773926,252.8340769958496,245.06725967407226,336.3228759765625,238.5650177001953C419.8116749572754,232.06277572631836,434.99553833007815,149.2018000793457,529.1480102539062,153.3632354736328C623.3004821777344,157.52467086791992,622.7533892822265,224.04484268188477,660.986572265625,252.914794921875" fill="none" stroke-width="23" stroke="hsl(50, 90%, 38%)" stroke-linecap="round" transform="matrix(0.7314210254961915,-2.7755575615628914e-16,-2.7755575615628914e-16,-0.7314210254961915,117.27132087616468,350.2017651289411)" stroke-dasharray="97 48" stroke-opacity="1"></path><defs><linearGradient id="SvgjsLinearGradient1000"><stop stop-color="hsl(37, 99%, 67%)" offset="0"></stop><stop stop-color="hsl(316, 73%, 52%)" offset="1"></stop></linearGradient></defs></svg>
          </div>
        </div>
        
        <p class="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl mx-auto md:mx-0">
          {settings.aboutText || defaultAboutText}
        </p>
      </div>

      <div class="w-full aspect-video bg-[#cde0fb] rounded-sm shadow-md flex items-center justify-center overflow-hidden max-w-xl mx-auto md:max-w-none">
            <img src={settings.aboutImage ? `http://localhost:9999/assets/${settings.aboutImage}` : "src/assets/bglogin.jpg"} alt="Background About" class="w-full h-full object-cover rounded-sm"/>
      </div>

    </div>
  </section>
  <section id="gallery" class="relative w-full min-h-[80vh] bg-gradient-to-r from-[#0b355b] to-[#1a5c8c] px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-24 scroll-mt-24 flex items-center">
        <div class="absolute overflow-hidden top-0 right-0 w-full h-full flex items-center justify-center z-0 opacity-30 pointer-events-none">
          <img src="src/assets/bg-bawah.svg" alt="Background Waves" class="min-w-[1000px] w-full h-full object-cover" />        
        </div>
    <div class="max-w-[1400px] mx-auto w-full flex flex-col items-center">
      
      <div class="text-center mb-12 md:mb-16">
        <div class="relative inline-block">
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white relative z-10">Gallery</h2>
          <div class="absolute -top-6 sm:-top-8 md:-top-10 -left-6 sm:-left-10 md:-left-20 w-full h-full opacity-60" >
            <svg class="w-[180px] sm:w-[240px] md:w-[350px] h-auto" viewBox="0 0 800 400"><path d="M133.63229370117188,273.5426025390625C178.1255682373047,270.64872772216796,283.36025446573893,260.2780115763346,354.2601013183594,259.19281005859375C425.1599481709798,258.1076085408529,458.79520991007485,266.3527646891276,485.2017822265625,268.16143798828125" fill="none" stroke-width="14" stroke="hsl(30, 100%, 40%)" stroke-linecap="round" transform="matrix(-1.0500000000000007,8.743006318923108e-16,-8.743006318923108e-16,-1.0500000000000007,724.8878898620611,479.6508918762206)" stroke-dasharray="56 28" stroke-opacity="1"></path><defs><linearGradient id="SvgjsLinearGradient1000"><stop stop-color="hsl(37, 99%, 67%)" offset="0"></stop><stop stop-color="hsl(316, 73%, 52%)" offset="1"></stop></linearGradient></defs></svg>          </div>
        </div>
        <p class="text-white text-xs sm:text-sm mt-4">All Images</p>
      </div>

      <div class="relative w-full max-w-6xl flex items-center justify-center px-8 sm:px-12 md:px-16">
        
        <button on:click={slideLeft} class="absolute left-0 sm:left-2 md:left-4 z-20 w-8 h-8 md:w-10 md:h-10 bg-[#e2e8f0] hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors group cursor-pointer">
          <svg class="w-5 h-5 text-gray-500 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <div 
          bind:this={sliderContainer}
          class="w-full flex gap-4 md:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth hilangkan-scrollbar py-4"
        >
          {#each itemsToRender as item}
            <div class="w-full md:w-[calc(50%-1rem)] shrink-0 snap-center aspect-[4/3] bg-[#cde0fb] rounded-sm shadow-xl flex items-center justify-center overflow-hidden">
              {#if item.isDefault}
                <span class="text-[#0b355b]/50 font-bold text-2xl">{item.title}</span>
              {:else}
                <img src={`http://localhost:9999/assets/${item.image}`} alt={item.title} class="w-full h-full object-cover"/>
              {/if}
            </div>
          {/each}
        </div>

        <button on:click={slideRight} class="absolute right-0 sm:right-2 md:right-4 z-20 w-8 h-8 md:w-10 md:h-10 bg-[#e2e8f0] hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors group cursor-pointer">
          <svg class="w-6 h-6 text-gray-500 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

      </div>

    </div>
  </section>



</div>

<footer>
  <Footer />
</footer>