<script>
  import { isSidebarOpen } from "./stores/sidebarStore.js";

  export let handleLogout;
  export let userAvatar;
  export let currentUserName;
  export let title = "Hub";

  function toggleSidebar() {
    $isSidebarOpen = !$isSidebarOpen;
  }

  let isDropdownOpen = false;
  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }
  function closeDropdown() {
    isDropdownOpen = false;
  }
</script>

<header class="flex items-center justify-between h-16 px-4 sm:px-8 transition-all duration-300 bg-white border-b border-gray-200 shadow-sm shrink-0 z-10">
  <div class="flex items-center gap-3 text-gray-600">
    <button on:click={toggleSidebar} class="flex items-center justify-center p-1.5 transition-colors rounded-md cursor-pointer hover:bg-gray-100 text-gray-800">
      <svg class="w-5 h-5" stroke-width="2" viewBox="0 0 48 48">
        <path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M7.95 11.95h32m-32 12h32m-32 12h32" />
      </svg>
    </button>
    <h1 class="hidden text-base font-bold text-gray-700 md:block">{title}</h1>
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
      <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {#if isDropdownOpen}
      <div class="fixed inset-0 z-40" on:click={closeDropdown} aria-hidden="true"></div>
      <div class="absolute right-0 z-50 w-48 py-2 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg">
        <button on:click={() => { window.location.href = '#/user/settings'; closeDropdown(); }} class="flex items-center w-full gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors text-left hover:bg-gray-50">
          <img class="w-4 h-4" src="/setting.svg" alt="Settings" /> Settings
        </button>
        <div class="w-full h-px my-1 bg-gray-100"></div>
        <button on:click={handleLogout} class="flex items-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors text-left hover:bg-red-50">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    {/if}
  </div>
</header>