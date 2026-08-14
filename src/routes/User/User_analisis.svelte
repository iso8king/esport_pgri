<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import AnalisisDashboard from "../../lib/AnalisisDashboard.svelte";

  let currentUserName = "Loading...";
  let isLoading = true;
  let userAvatar = '';
  const avatar = localStorage.getItem("user_avatar");

  if(avatar !== 'null'){
      userAvatar = `/avatar/${localStorage.getItem("user_avatar")}`;
  }
  

  onMount(() => {
    const name = localStorage.getItem("user_name");
    if (name) {
      currentUserName = name;
    } else {
      push("/");
      return;
    }

    const userRole = localStorage.getItem("user_role");
    if (userRole !== "user") {
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'Redirecting......',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/admin/beranda');
      });
      return;
    }

    const userStatus = localStorage.getItem("status");
    if (userStatus === "false") {
      Swal.fire({
        icon: 'warning',
        title: 'Belum Verifikasi',
        text: 'Redirecting......',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/verification');
      });
      return;
    }

    isLoading = false;
  });

  function handleLogout() {
    Swal.fire({ 
      title: "Yakin ingin keluar?", 
      icon: "warning", 
      showCancelButton: true, 
      confirmButtonColor: "#ef4444", 
      cancelButtonColor: "#9ca3af", 
      confirmButtonText: "Ya, Logout!" 
    }).then((r) => { 
      if (r.isConfirmed) { 
        localStorage.clear();
        push("/"); 
      } 
    });
  }
  let innerWidth = 0;
  let isSidebarOpen = true;
  $: if (innerWidth > 0 && innerWidth < 768) { 
    isSidebarOpen = false; 
  } else if (innerWidth >= 768) { 
    isSidebarOpen = true; 
  }
  
  function toggleSidebar() { 
    isSidebarOpen = !isSidebarOpen; 
  }

  let isDropdownOpen = false;
  function toggleDropdown() { 
    isDropdownOpen = !isDropdownOpen; 
  }
  function closeDropdown() { 
    isDropdownOpen = false; 
  }
</script>

<svelte:window bind:innerWidth />

{#if isLoading}
  <div class="flex items-center justify-center h-screen bg-gray-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a2e52] mx-auto"></div>
      <p class="mt-4 text-gray-600">Memuat data kegiatan...</p>
    </div>
  </div>

{:else}
<div class="flex h-screen overflow-hidden font-sans bg-gray-50">
  
  {#if isSidebarOpen && innerWidth < 768}
    <div on:click={toggleSidebar} class="fixed inset-0 z-40 transition-opacity bg-black/50 backdrop-blur-sm" aria-hidden="true"></div>
  {/if}

  <aside class="{isSidebarOpen ? 'w-64' : 'w-0'} absolute md:relative z-50 overflow-hidden bg-[#0a2e52] text-white flex flex-col h-full shrink-0 shadow-xl transition-all duration-300 whitespace-nowrap">
    <div class="flex items-center justify-between px-6 py-8">
      <div class="flex items-center gap-3">
        <img src="/logo1.png" alt="logo" class="w-10 h-12 text-white" />
        <span class="text-xl md:text-2xl font-bold tracking-wider">smegione</span>
      </div>
      <button on:click={toggleSidebar} class="p-1 transition-colors rounded-md cursor-pointer md:hidden bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    <nav class="flex-1 px-4 space-y-6 overflow-y-auto">
      <div class="flex flex-col gap-1">
        <button on:click={() => { window.location.href = '#/user/absensi'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Dashboard
        </button>
        <button on:click={() => { window.location.href = "#/user/kegiatan"; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          Kegiatan
        </button>
        <button on:click={() => { window.location.href = "#/user/analisis"; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          Analisis
        </button>
      </div>
      <div class="p-5">
        <button on:click={handleLogout} class="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-white transition-colors bg-red-600 rounded-lg shadow-md hover:bg-red-700">Logout</button>
      </div>
    </nav>
  </aside>
    
    <div class="flex flex-col flex-1 h-full overflow-hidden">
      <header class="flex items-center justify-between h-16 px-4 sm:px-8 transition-all duration-300 bg-white border-b border-gray-200 shadow-sm shrink-0 z-10">
        <div class="flex items-center gap-3 text-gray-600">
          <button on:click={toggleSidebar} class="flex items-center justify-center p-1.5 transition-colors rounded-md cursor-pointer hover:bg-gray-100 text-gray-800">
            <svg class="w-5 h-5" stroke-width="2" viewBox="0 0 48 48"><path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M7.95 11.95h32m-32 12h32m-32 12h32" /></svg>
          </button>
          <h1 class="hidden text-base font-bold text-gray-700 md:block">Analisis</h1>
        </div>
        <div class="relative">
          <button on:click={toggleDropdown} class="flex items-center gap-2 px-2 py-1 transition-colors rounded-md cursor-pointer md:gap-3 hover:bg-gray-50 focus:outline-none">
            {#if userAvatar}
              <img src={userAvatar} alt="Profile" class="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-sm" />
            {:else}
              <div class="w-11 h-11 rounded-full bg-gray-400 flex items-center justify-center">
                <span class="text-lg font-bold text-black">{currentUserName.charAt(0).toUpperCase()}</span>
              </div>
            {/if}
            <span class="text-sm font-bold text-gray-700">{currentUserName}</span>
            <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {#if isDropdownOpen}
            <div class="fixed inset-0 z-40" on:click={closeDropdown} aria-hidden="true"></div>
            <div class="absolute right-0 z-50 w-48 py-2 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg">
              <button on:click={() => { window.location.href = '#/user/settings'; closeDropdown(); }} class="flex items-center w-full gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors text-left hover:bg-gray-50">
                <img class="w-4 h-4" src="/setting.svg" alt="Settings" /> Settings
              </button>
              <div class="w-full h-px my-1 bg-gray-100"></div>
              <button on:click={handleLogout} class="flex items-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors text-left hover:bg-red-50">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Logout
              </button>
            </div>
          {/if}
        </div>
      </header>

      <main class="flex-1 p-4 overflow-x-hidden overflow-y-auto sm:p-6 lg:p-10 bg-[#fbfcfd]">
        <AnalisisDashboard />
      </main>
    </div>
  </div>
{/if}