<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import { fetchWithAuth } from "$lib/auth.js";

  let beritaList = [];
  let isLoading = true;

  let userAvatar = "";
  const avatar = localStorage.getItem("user_avatar");

  if (avatar !== "null") {
    userAvatar = `/avatar/${localStorage.getItem("user_avatar")}`;
  }

  // Modal state
  let isModalOpen = false;
  let isEditing = false;
  let editSlug = null;
  let isSubmitting = false;

  let formData = {
    link: "",
  };

  function openModal() {
    isEditing = false;
    editSlug = null;
    formData = { link: "" };
    isModalOpen = true;
  }

  function closeModal() {
    isModalOpen = false;
    isEditing = false;
    editSlug = null;
    formData = { link: "" };
  }

  // Ambil data berita dari backend
  async function fetchBeritaData() {
    isLoading = true;
    try {
      const response = await fetchWithAuth("/api/berita/get", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data?.data || result.data || [];
        beritaList = data;
      } else {
        beritaList = [];
      }
    } catch (error) {
      console.error("Error fetching berita:", error);
      beritaList = [];
    } finally {
      isLoading = false;
    }
  }

  function isValidUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function handleSubmit() {
    if (!formData.link) {
      Swal.fire({
        icon: "warning",
        title: "Link belum diisi!",
        text: "Masukkan link artikel dari blog kamu.",
        confirmButtonColor: "#0a4682",
      });
      return;
    }

    if (!isValidUrl(formData.link)) {
      Swal.fire({
        icon: "warning",
        title: "Link Tidak Valid",
        text: "Masukkan link artikel yang valid, contoh: https://brogu-ten.vercel.app/example",
        confirmButtonColor: "#0a4682",
      });
      return;
    }

    isSubmitting = true;

    try {
      Swal.fire({
        title: isEditing ? "Mengubah data..." : "Mengambil data artikel...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const url = isEditing
        ? `/api/berita/${editSlug}/update`
        : `/api/berita/create`;
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method: method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ link: formData.link }),
      });

      const result = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: isEditing ? "Gagal Mengubah Berita!" : "Gagal Membuat Berita!",
          text:
            result.message ||
            result.errors ||
            "Data tidak tersimpan di server.",
          confirmButtonColor: "#0a4682",
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: isEditing
          ? "Berita berhasil diubah!"
          : "Berita berhasil ditambahkan!",
        text: result.message || "Data telah tersimpan di server.",
        confirmButtonColor: "#0a4682",
        timer: 1500,
        showConfirmButton: false,
      });

      closeModal();
      await fetchBeritaData();
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: isEditing ? "Gagal mengubah berita!" : "Gagal menyimpan berita!",
        text: error.message || "Terjadi kesalahan saat menghubungi server.",
        confirmButtonColor: "#0a4682",
      });
    } finally {
      isSubmitting = false;
    }
  }

  function openEditModal(berita) {
    isEditing = true;
    editSlug = berita.id;
    formData = { link: berita.link };
    isModalOpen = true;
  }

  async function deleteBerita(slug) {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Berita yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({
            title: "Menghapus berita...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const response = await fetchWithAuth(`/api/berita/${slug}/delete`, {
            method: "DELETE",
            credentials: "include",
          });

          const resData = await response.json();

          if (response.ok) {
            Swal.fire({
              icon: "success",
              title: "Dihapus!",
              text: "Berita berhasil dihapus.",
              confirmButtonColor: "#0a4682",
            });
            await fetchBeritaData();
          } else {
            Swal.fire({
              icon: "error",
              title: "Gagal!",
              text: resData.message || "Gagal menghapus berita.",
              confirmButtonColor: "#0a4682",
            });
          }
        } catch (error) {
          console.error(error);
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: "Terjadi kesalahan saat menghubungi server.",
            confirmButtonColor: "#0a4682",
          });
        }
      }
    });
  }

  let currentUserName = "Loading...";

  onMount(() => {
    const name = localStorage.getItem("user_name");
    if (name) {
      currentUserName = name;
    } else {
      push("/");
    }

    if (localStorage.getItem("role") !== "admin") {
      Swal.fire({
        icon: "error",
        title: "Unauthorized",
        text: "Redirecting......",
        confirmButtonColor: "#0b5ba2",
      }).then(() => {
        push("/user/absensi");
      });
      return;
    }

    const userStatus = localStorage.getItem("status");
    if (!userStatus) {
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

    fetchBeritaData();
  });

  function handleLogout() {
    Swal.fire({
      title: "Yakin ingin keluar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, Logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_role");
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

<div class="flex h-screen overflow-hidden font-sans bg-gray-50">
  {#if isSidebarOpen && innerWidth < 768}
    <div
      on:click={toggleSidebar}
      class="fixed inset-0 z-40 transition-opacity bg-black/50 backdrop-blur-sm"
      aria-hidden="true"
    ></div>
  {/if}

  <aside
    class="{isSidebarOpen
      ? 'w-64'
      : 'w-0'} absolute md:relative z-50 overflow-hidden bg-[#0a2e52] text-white flex flex-col h-full shrink-0 shadow-xl transition-all duration-300 whitespace-nowrap"
  >
    <div class="flex items-center justify-between px-6 py-8">
      <div class="flex items-center gap-3">
        <img
          src="src/assets/logo1.png"
          alt="logo"
          class="w-10 h-12 text-white"
        />
        <span class="text-2xl font-bold tracking-wider">E-Sport</span>
      </div>

      <button
        on:click={toggleSidebar}
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

    <nav class="flex-1 px-4 space-y-6 overflow-y-auto">
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
          on:click={() => {
            window.location.href = "#/admin/beranda";
          }}
          class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
        >
          Beranda
        </button>
      </div>

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
          <button
            on:click={() => {
              window.location.href = "#/admin/anggota";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Anggota
          </button>
          <button
            on:click={() => {
              window.location.href = "#/admin/absensi";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Absensi
          </button>
          <button
            on:click={() => {
              window.location.href = "#/admin/analisis";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Analisis
          </button>
          <button
            on:click={() => {
              window.location.href = "#/admin/jadwal";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Jadwal
          </button>
          <button
            on:click={() => {
              window.location.href = "#/admin/berita";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10"
          >
            Berita
          </button>
        </div>
      </div>

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

  <div class="flex flex-col flex-1 h-full overflow-hidden">
    <header
      class="flex items-center justify-between h-16 px-8 transition-all duration-300 bg-white border-b border-gray-200 shadow-sm shrink-0 z-10"
    >
      <div class="flex items-center gap-3 text-gray-600">
        <button
          on:click={toggleSidebar}
          class="flex items-center justify-center p-1.5 transition-colors rounded-md cursor-pointer hover:bg-gray-100 text-gray-800"
        >
          <svg class="w-5 h-5" stroke-width="2" viewBox="0 0 48 48">
            <path
              fill="none"
              stroke="#000000"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="4"
              d="M7.95 11.95h32m-32 12h32m-32 12h32"
            />
          </svg>
        </button>
        <h1 class="hidden text-base font-bold text-gray-700 md:block">
          Berita
        </h1>
      </div>

      <div class="relative">
        <button
          on:click={toggleDropdown}
          class="flex items-center gap-2 px-2 py-1 transition-colors rounded-md cursor-pointer md:gap-3 hover:bg-gray-50 focus:outline-none"
        >
          {#if userAvatar}
            <img
              src={userAvatar}
              alt="Profile"
              class="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-sm"
            />
          {:else}
            <div
              class="w-11 h-11 rounded-full bg-gray-400 flex items-center justify-center"
            >
              <span class="text-lg font-bold text-black"
                >{currentUserName.charAt(0).toUpperCase()}</span
              >
            </div>
          {/if}
          <span class="text-sm font-bold text-gray-700">{currentUserName}</span>
          <svg
            class="w-4 h-4 text-gray-400 transition-transform duration-200 {isDropdownOpen
              ? 'rotate-180'
              : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 9l-7 7-7-7"
            /></svg
          >
        </button>

        {#if isDropdownOpen}
          <div
            class="fixed inset-0 z-40"
            on:click={closeDropdown}
            aria-hidden="true"
          ></div>

          <div
            class="absolute right-0 z-50 w-48 py-2 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg animate-fade-in-down"
          >
            <button
              on:click={() => {
                window.location.href = "#/admin/settings";
                closeDropdown();
              }}
              class="flex items-center w-full gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors text-left hover:bg-gray-50"
            >
              <img
                class="w-4 h-4 text-gray-500"
                src="src/assets/setting.svg"
                alt="Settings Icon"
              />
              Settings
            </button>

            <div class="w-full h-px my-1 bg-gray-100"></div>

            <button
              on:click={handleLogout}
              class="flex items-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors text-left hover:bg-red-50"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        {/if}
      </div>
    </header>

    <main
      class="flex-1 p-4 overflow-x-hidden overflow-y-auto sm:p-6 lg:p-10 bg-gray-50"
    >
      <div class="max-w-full mx-auto space-y-7">
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <h2 class="text-2xl font-extrabold text-gray-800 lg:text-3xl">
            Berita & Artikel
          </h2>
        </div>

        <div
          class="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl"
        >
          <div
            class="px-4 py-5 flex items-center justify-between border-b border-gray-100 sm:px-6"
          >
            <h3 class="text-lg font-bold text-gray-800">Daftar Berita</h3>
            <button
              on:click={openModal}
              class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] hover:shadow-lg active:scale-95"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tambah Berita
            </button>
          </div>

          {#if isLoading}
            <div class="flex justify-center items-center p-8">
              <div class="text-center">
                <div
                  class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a4682]"
                ></div>
                <p class="mt-2 text-gray-500">Memuat data...</p>
              </div>
            </div>
          {:else if beritaList.length === 0}
            <div class="text-center p-10 text-gray-500">
              <p class="font-semibold">Belum ada berita</p>
              <p class="text-xs text-gray-400 mt-1">
                Tambahkan link artikel dari blog kamu, judul dan gambar akan
                diambil otomatis.
              </p>
            </div>
          {:else}
            <div
              class="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {#each beritaList as berita}
                <div
                  class="flex flex-col overflow-hidden bg-white border border-gray-150 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div class="w-full aspect-video bg-slate-100 overflow-hidden">
                    {#if berita.coverImage}
                      <img
                        src={berita.coverImage}
                        alt={berita.title}
                        class="w-full h-full object-cover"
                      />
                    {:else}
                      <div
                        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0e3b61] to-[#175283]"
                      >
                        <svg
                          class="w-10 h-10 text-white/60"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="1.5"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6v4H7v-4z"
                          />
                        </svg>
                      </div>
                    {/if}
                  </div>
                  <div class="flex flex-col flex-1 p-4">
                    <h4 class="text-sm font-bold text-gray-900 line-clamp-2">
                      {berita.title}
                    </h4>
                    <a
                      href={berita.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="mt-2 text-xs font-semibold text-[#0a4682] hover:underline truncate"
                    >
                      {berita.link}
                    </a>
                    <div
                      class="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-gray-100"
                    >
                      <!-- Tombol Update -->
                      <button
                        on:click={() => openEditModal(berita)}
                        class="p-2 text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                        title="Update Berita"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      <!-- Tombol Hapus -->
                      <button
                        on:click={() => deleteBerita(berita.id)}
                        class="p-2 text-red-600 transition-colors rounded-md hover:bg-red-50"
                        title="Hapus Berita"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </main>
  </div>

  {#if isModalOpen}
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
    >
      <div
        class="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm"
        on:click={closeModal}
        aria-hidden="true"
      ></div>

      <div
        class="relative flex flex-col w-full max-w-lg shadow-2xl bg-[#f8fafc] rounded-xl max-h-[90vh]"
      >
        <div
          class="flex items-center justify-between p-5 bg-white border-b border-gray-100 sm:p-6 rounded-t-xl"
        >
          <h2 class="text-lg font-extrabold text-gray-800 sm:text-xl">
            {isEditing ? "Update Berita" : "Tambah Berita"}
          </h2>
          <button
            on:click={closeModal}
            class="flex items-center justify-center w-8 h-8 text-white transition-colors shadow-sm bg-[#0a2e52] hover:bg-red-600 rounded-md"
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

        <div class="p-5 space-y-4 overflow-y-auto sm:p-6">
          <div>
            <label
              for="link"
              class="block mb-1.5 text-sm font-semibold text-gray-700"
              >Link Artikel (Blog)</label
            >
            <input
              id="link"
              type="url"
              bind:value={formData.link}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="https://brogu-ten.vercel.app/example"
            />
            <p class="mt-1 text-xs text-gray-400">
              Cukup tempel link artikel dari blog kamu. Judul dan gambar cover
              akan diambil otomatis dari server.
            </p>
          </div>
        </div>

        <div
          class="flex items-center justify-end gap-3 p-5 bg-white border-t border-gray-100 sm:p-6 rounded-b-xl"
        >
          <button
            on:click={closeModal}
            class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-red-600 rounded-lg shadow-md hover:bg-red-700 active:scale-95"
          >
            Cancel
          </button>
          <button
            on:click={handleSubmit}
            disabled={isSubmitting}
            class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .animate-fade-in-down {
    animation: fadeInDown 0.3s ease-in-out;
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
