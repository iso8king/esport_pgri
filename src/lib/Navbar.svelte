<script>
  function scrollToSection(id) {
    const elemen = document.getElementById(id);
    if (elemen) {
      elemen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
</script>

<nav class="sticky top-0 z-50 w-full bg-gradient-to-r from-[#0b355b] to-[#1a5d9c] px-4 sm:px-6 md:px-10 py-4 md:py-6 shadow-sm transition-all duration-300">
  <div class="max-w-[1600px] mx-auto flex items-center justify-between">
    
    <a href="/" class="flex items-center gap-2 sm:gap-4 text-white hover:opacity-80 transition-opacity">
      <img src="/logo1.png" alt="logo" class="w-10 sm:w-12 md:w-[60px] h-auto object-contain">
      <h2 class="font-semibold text-lg sm:text-xl md:text-2xl whitespace-nowrap">E-Sport PGRI</h2>
    </a>

    <ul class="hidden md:flex items-center gap-8 text-white text-sm font-medium">
      <li>
        <button 
        on:click={() => scrollToSection('home')}
        class="flex items-center gap-1 hover:text-blue-200 transition-colors">
          Home
        </button>
      </li>
      <li>
        <button 
        on:click={() => scrollToSection('gallery')}
        class="flex items-center gap-1 hover:text-blue-200 transition-colors">
          Gallery
        </button>
      </li>
      <li>
        <button 
        on:click={() => scrollToSection('about')}  
        class="flex items-center gap-1 hover:text-blue-200 transition-colors">
          About Us
        </button>
      </li>
      <li>
        <button class="flex items-center gap-1 hover:text-blue-200 transition-colors">
          <a href="#contact" class="text-white hover:text-blue-200">Contact</a>
        </button>
      </li>
    </ul>

    <a 
      href="#/signin" 
      class="bg-[#ffffff] hover:bg-[#b5cce6] text-[#043873] px-4 py-1.5 sm:px-7 sm:py-2 rounded-md font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow active:scale-95 whitespace-nowrap"
    >
      Login
    </a>
  </div>
</nav>