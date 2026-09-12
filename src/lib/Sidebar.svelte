<script>
  import { isSidebarOpen } from "./stores/sidebarStore.js";

  export let handleLogout;

  let innerWidth = 0;
  let role = "user";

  // Ambil role dari localStorage
  if (typeof window !== "undefined") {
    role = localStorage.getItem("role") || "user";
  }

  // Responsive sidebar
  $: if (innerWidth > 0 && innerWidth < 768) {
    $isSidebarOpen = false;
  } else if (innerWidth >= 768) {
    $isSidebarOpen = true;
  }

  function navigate(path) {
    window.location.href = path;
  }
</script>

<svelte:window bind:innerWidth />

{#if $isSidebarOpen && innerWidth < 768}
  <div
    on:click={() => ($isSidebarOpen = false)}
    class="fixed inset-0 z-40 transition-opacity bg-black/50 backdrop-blur-sm"
    aria-hidden="true"
  ></div>
{/if}

<aside
  class="{$isSidebarOpen ? 'w-64' : 'w-0'}
         {innerWidth < 768 ? 'fixed left-0 top-0 z-50 h-full' : 'relative z-0'}
         overflow-hidden bg-[#0a2e52] text-white flex flex-col h-screen shrink-0 shadow-xl transition-all duration-300 whitespace-nowrap"
>
  <!-- HEADER -->
  <div class="flex items-center justify-between px-6 py-8">
    <div class="flex items-center gap-3">
      <img
        src="/logo1.png"
        alt="logo"
        class="w-10 h-12 text-white"
      />

      <span class="text-xl md:text-2xl font-bold tracking-wider">
        smegione
      </span>
    </div>

    <button
      on:click={() => ($isSidebarOpen = false)}
      class="p-1 transition-colors rounded-md cursor-pointer md:hidden bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>

  <!-- NAVIGATION -->
  <nav class="flex-1 px-4 space-y-6 overflow-y-auto">

    {#if role === "admin"}

      <!-- ================= ADMIN SIDEBAR ================= -->

      <!-- Dashboard -->
      <div>
        <p
          class="flex items-center gap-2 px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>

          Dashboard
        </p>

        <button
          on:click={() => navigate("#/admin/beranda")}
          class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
        >
          Beranda
        </button>
      </div>

      <!-- Management -->
      <div>
        <p
          class="flex items-center gap-2 px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>

          Management
        </p>

        <div class="flex flex-col gap-1">

          <!-- Anggota -->
          <button
            on:click={() => navigate("#/admin/anggota")}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Anggota
          </button>

          <!-- Absensi -->
          <button
            on:click={() => navigate("#/admin/absensi")}
           class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Absensi
          </button>

          <!-- Analisis -->
          <button
            on:click={() => navigate("#/admin/analisis")}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Analisis
          </button>

          <!-- Jadwal -->
          <button
            on:click={() => navigate("#/admin/jadwal")}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Jadwal
          </button>

          <!-- Berita -->
          <button
            on:click={() => navigate("#/admin/berita")}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Berita
          </button>

        </div>

        <!-- Hub -->
        <div>
          <p
            class="flex items-center gap-2 px-2 mb-2 mt-5 text-xs font-semibold tracking-wider text-gray-400 uppercase"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3.87a4 4 0 00-3-3.87m-9 0a4 4 0 00-3 3.87"
              />
            </svg>

            Hub
          </p>

          <div class="flex flex-col gap-1">
            <button
              on:click={() => navigate("#/hub")}
              class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10"
            >
              SmegioneHub
            </button>
          </div>
        </div>
      </div>

    {:else}

     

      <div class="flex flex-col gap-1">

        <button
          on:click={() => navigate("#/user/absensi")}
          class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>

          Dashboard
        </button>

        <!-- Kegiatan -->
        <button
          on:click={() => navigate("#/user/kegiatan")}
          class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>

          Kegiatan
        </button>

        <!-- Analisis -->
        <button
          on:click={() => navigate("#/user/analisis")}
          class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>

          Analisis
        </button>

        <!-- SmegioneHub -->
        <button
          on:click={() => navigate("#/user/hub")}
          class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3.87a4 4 0 00-3-3.87m-9 0a4 4 0 00-3 3.87"
            />
          </svg>

          SmegioneHub
        </button>

      </div>

    {/if}

    <div class="p-5">
      <button
        on:click={handleLogout}
        class="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-white transition-colors bg-red-600 rounded-lg shadow-md hover:bg-red-700"
      >
        Logout
      </button>
    </div>

  </nav>
</aside>