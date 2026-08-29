<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import Swal from "sweetalert2";
    import Sidebar from "../lib/Sidebar.svelte";

    let innerWidth = 0;
    let currentUserName = "Loading...";
    let isLoading = true;
    let userAvatar = "";
    const avatar = localStorage.getItem("user_avatar");

    if (avatar !== "null") {
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


        const userStatus = localStorage.getItem("status");
        if (userStatus === "false") {
            Swal.fire({
                icon: "warning",
                title: "Belum Verifikasi",
                text: "Redirecting......",
                confirmButtonColor: "#0b5ba2",
            }).then(() => {
                push("/verification");
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
  <div class='flex h-screen overflow-hidden font-sans bg-gray-50'>
    <Sidebar {handleLogout}  {currentUserName} {userAvatar}/>

    
  </div>
{/if}
