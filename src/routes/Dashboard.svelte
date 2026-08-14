<script>
    import { onMount } from "svelte";
    import Navbar from "../lib/Navbar.svelte";
    import Footer from "../lib/Footer.svelte";

    let sliderContainer;

    const defaultAboutText =
        "Images, Videos, PDFs and audio files are supported. Create multi impressions and dynamic directs from the app. Take photos with the mobile app and save them in a note.";

    let settings = {
        heroImage: null,
        aboutText: defaultAboutText,
        aboutImage: null,
        gallery: []
    };

    // =========================
    // BERITA
    // =========================
    let beritaList = [];
    let isLoadingBerita = true;

    // Berapa berita yang ditampilkan
    let beritaLimit = 3;

    // Urutkan berita terbaru -> terlama
    $: sortedBerita = [...beritaList].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Berita yang ditampilkan
    $: visibleBerita = sortedBerita.slice(0, beritaLimit);

    // Apakah masih ada berita lain?
    $: hasMoreBerita = beritaLimit < sortedBerita.length;

    // =========================
    // FETCH DATA
    // =========================
    onMount(async () => {
        // Fetch settings
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

        // Fetch berita
        try {
            const res = await fetch("/api/berita/get");

            if (res.ok) {
                const json = await res.json();

                const data = json.data?.data || json.data || [];

                beritaList = data;
            }
        } catch (e) {
            console.error("Error fetching berita:", e);
        } finally {
            isLoadingBerita = false;
        }
    });

    // =========================
    // BERITA FUNCTION
    // =========================

    function openBerita(link) {
        if (link) {
            window.open(link, "_blank", "noopener,noreferrer");
        }
    }

    function showMoreBerita() {
        beritaLimit += 3;
    }

    // =========================
    // GALLERY
    // =========================

    $: itemsToRender =
        settings.gallery && settings.gallery.length > 0
            ? settings.gallery
            : [
                  {
                      id: 1,
                      isDefault: true,
                      title: "Gambar 1",
                      description:
                          "Deskripsi singkat mengenai foto kegiatan turnamen PGRI."
                  },
                  {
                      id: 2,
                      isDefault: true,
                      title: "Gambar 2",
                      description:
                          "Keseruan peserta dalam turnamen E-sport PGRI."
                  },
                  {
                      id: 3,
                      isDefault: true,
                      title: "Gambar 3",
                      description:
                          "Sesi latihan rutin tim E-sport PGRI."
                  },
                  {
                      id: 4,
                      isDefault: true,
                      title: "Gambar 4",
                      description:
                          "Penyerahan trofi juara utama turnamen."
                  },
                  {
                      id: 5,
                      isDefault: true,
                      title: "Gambar 5",
                      description:
                          "Foto bersama tim E-sport PGRI."
                  }
              ];

    function slideLeft() {
        if (sliderContainer) {
            if (sliderContainer.scrollLeft <= 10) {
                sliderContainer.scrollTo({
                    left: sliderContainer.scrollWidth,
                    behavior: "smooth"
                });
            } else {
                sliderContainer.scrollBy({
                    left: -sliderContainer.clientWidth,
                    behavior: "smooth"
                });
            }
        }
    }

    function slideRight() {
        if (sliderContainer) {
            const maxScroll =
                sliderContainer.scrollWidth - sliderContainer.clientWidth;

            if (sliderContainer.scrollLeft >= maxScroll - 10) {
                sliderContainer.scrollTo({
                    left: 0,
                    behavior: "smooth"
                });
            } else {
                sliderContainer.scrollBy({
                    left: sliderContainer.clientWidth,
                    behavior: "smooth"
                });
            }
        }
    }

    function scrollToSection(id) {
        const element = document.getElementById(id);

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
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

    <!-- ========================= -->
    <!-- HOME -->
    <!-- ========================= -->

    <section
        id="home"
        class="relative w-full min-h-[85vh] bg-gradient-to-r from-[#0b355b] to-[#1a5c8c] px-4 sm:px-6 md:px-8 pt-28 pb-16 sm:pt-32 sm:pb-20 md:py-24 flex items-center"
    >
        <div
            class="absolute overflow-hidden top-0 right-0 w-full h-full flex items-center justify-center z-0 opacity-20 pointer-events-none"
        >
            <img
                src="/bg-bawah.svg"
                alt="Background Waves"
                class="min-w-[1000px] w-full h-full object-cover"
            />
        </div>

        <div
            class="max-w-[1400px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center relative z-10"
        >
            <div
                class="text-center md:text-left text-white flex flex-col items-center md:items-start"
            >
                <h1
                    class="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6"
                >
                    E-Sports
                    <br class="hidden md:block" />
                    <span class="text-blue-200">Ekstrakurikuler</span>
                </h1>

                <p
                    class="text-blue-100/90 text-sm sm:text-base md:text-lg max-w-md leading-relaxed mb-8 font-normal"
                >
                    Selamat datang di website resmi Ekstrakurikuler E-Sports
                    SMKS PGRI 1 Tangerang. Tempat mengasah minat, strategi, dan
                    sportivitas atlet digital masa depan.
                </p>

                <div
                    class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                >
                    <button
                        on:click={() => scrollToSection("about")}
                        class="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-blue-50 text-[#0b355b] font-bold rounded-lg shadow-lg hover:shadow-white/10 active:scale-[0.98] transition-all duration-300 text-center cursor-pointer text-sm sm:text-base"
                    >
                        Jelajahi Profil
                    </button>
                </div>
            </div>

            <div
                class="w-full aspect-video md:aspect-[4/3] bg-[#0c2e4e] rounded-2xl shadow-2xl border-4 border-white/10 flex items-center justify-center overflow-hidden max-w-xl mx-auto md:max-w-none transform hover:scale-[1.02] transition-all duration-500 shadow-blue-950/50"
            >
                <img
                    src={settings.heroImage
                        ? `/assets/${settings.heroImage}`
                        : "/bglogin.jpg"}
                    alt="Hero E-Sports"
                    class="w-full h-full object-cover"
                />
            </div>
        </div>
    </section>

    <!-- ========================= -->
    <!-- ABOUT -->
    <!-- ========================= -->

    <section
        id="about"
        class="relative overflow-hidden w-full min-h-[85vh] bg-white px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-28 scroll-mt-10 flex items-center"
    >
        <div
            class="max-w-[1400px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center relative z-10"
        >
            <div class="text-center md:text-left">
                <div class="relative inline-block mb-6">
                    <h2
                        class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0b355b]"
                    >
                        About Us
                    </h2>

                    <div
                        class="h-1.5 w-30 bg-[#1a5c8c] rounded-full mt-4 mx-auto md:mx-0"
                    ></div>
                </div>

                <div
                    class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left"
                >
                    <div
                        class="p-5 rounded-2xl bg-[#f8fafc] border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg"
                    >
                        <h4
                            class="font-bold text-[#0b355b] text-sm mb-1.5"
                        >
                            Turnamen Rutin
                        </h4>

                        <p
                            class="text-xs text-gray-500 leading-relaxed font-normal"
                        >
                            Berpartisipasi aktif dalam turnamen resmi
                            antar-pelajar tingkat regional & nasional.
                        </p>
                    </div>

                    <div
                        class="p-5 rounded-2xl bg-[#f8fafc] border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg"
                    >
                        <h4
                            class="font-bold text-[#0b355b] text-sm mb-1.5"
                        >
                            Fasilitas Lengkap
                        </h4>

                        <p
                            class="text-xs text-gray-500 leading-relaxed font-normal"
                        >
                            Latihan terstruktur dengan dukungan perangkat
                            berspesifikasi mumpuni.
                        </p>
                    </div>

                    <div
                        class="p-5 rounded-2xl bg-[#f8fafc] border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg"
                    >
                        <h4
                            class="font-bold text-[#0b355b] text-sm mb-1.5"
                        >
                            Keseimbangan
                        </h4>

                        <p
                            class="text-xs text-gray-500 leading-relaxed font-normal"
                        >
                            Menyeimbangkan prestasi akademik siswa dengan
                            pembinaan disiplin atlet digital.
                        </p>
                    </div>
                </div>
            </div>

            <div
                class="w-full aspect-video md:aspect-[4/3] bg-slate-100 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center overflow-hidden max-w-xl mx-auto md:max-w-none"
            >
                <img
                    src={settings.aboutImage
                        ? `/assets/${settings.aboutImage}`
                        : "/bglogin.jpg"}
                    alt="Background About"
                    class="w-full h-full object-cover"
                />
            </div>
        </div>
    </section>

    <section
        id="gallery"
        class="relative w-full min-h-[85vh] bg-gradient-to-r from-[#0b355b] to-[#1a5c8c] px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-28 scroll-mt-24 flex items-center"
    >
        <div
            class="max-w-[1400px] mx-auto w-full flex flex-col items-center relative z-10"
        >
            <div class="text-center mb-12 md:mb-16">
                <h2
                    class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white"
                >
                    Galeri Foto
                </h2>

                <div
                    class="h-1.5 w-16 bg-white rounded-full mt-4 mx-auto"
                ></div>
            </div>

            <div
                class="relative w-full max-w-6xl flex items-center justify-center px-4 sm:px-8 md:px-12"
            >
                <button
                    on:click={slideLeft}
                    class="absolute left-0 sm:-left-4 md:-left-8 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl transition-all duration-300 group cursor-pointer active:scale-95"
                >
                    <svg
                        class="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>

                <div
                    bind:this={sliderContainer}
                    class="w-full flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth hilangkan-scrollbar py-4"
                >
                    {#each itemsToRender as item}
                        <div
                            class="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] shrink-0 snap-center aspect-[4/3] rounded-2xl shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer bg-[#0c2e4e]"
                        >
                            {#if item.isDefault}
                                <div
                                    class="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0e3b61] to-[#175283] text-center"
                                >
                                    <span
                                        class="text-white font-bold text-lg mb-1"
                                    >
                                        {item.title}
                                    </span>

                                    <span
                                        class="text-blue-200/70 text-xs px-4 leading-relaxed line-clamp-2"
                                    >
                                        {item.description}
                                    </span>
                                </div>
                            {:else}
                                <img
                                    src={`/assets/${item.image}`}
                                    alt={item.description ||
                                        item.title ||
                                        "Foto Galeri"}
                                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            {/if}
                        </div>
                    {/each}
                </div>

                <button
                    on:click={slideRight}
                    class="absolute right-0 sm:-right-4 md:-right-8 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl transition-all duration-300 group cursor-pointer active:scale-95"
                >
                    <svg
                        class="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </section>

    <!-- ========================= -->
    <!-- BERITA -->
    <!-- ========================= -->

    <section
        id="berita"
        class="relative w-full min-h-[60vh] bg-white px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-28 scroll-mt-24"
    >
        <div class="max-w-[1400px] mx-auto w-full flex flex-col items-center">

            <!-- TITLE -->
            <div class="text-center mb-12 md:mb-16">
                <h2
                    class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0b355b]"
                >
                    Berita & Artikel
                </h2>

                <div
                    class="h-1.5 w-16 bg-[#1a5c8c] rounded-full mt-4 mx-auto"
                ></div>

                <p
                    class="text-gray-500 text-sm sm:text-base mt-4 max-w-xl mx-auto"
                >
                    Update terbaru seputar kegiatan dan prestasi E-Sports PGRI
                    dari blog kami.
                </p>
            </div>

            <!-- LOADING -->
            {#if isLoadingBerita}

                <div class="flex flex-col items-center py-10">
                    <div
                        class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0b355b]"
                    ></div>

                    <p class="mt-4 text-sm text-gray-400">
                        Memuat berita...
                    </p>
                </div>

            <!-- EMPTY -->
            {:else if beritaList.length === 0}

                <div class="text-center py-10 text-gray-400 text-sm">
                    Belum ada berita yang ditambahkan.
                </div>

            <!-- BERITA -->
            {:else}

                <div class="w-full">

                    {#each Array(Math.ceil(visibleBerita.length / 3)) as _, rowIndex}

                        {@const rowBerita = visibleBerita.slice(
                            rowIndex * 3,
                            rowIndex * 3 + 3
                        )}

                        <!--
                            Setiap row menggunakan justify-center.
                            Jadi kalau cuma ada 1 atau 2 berita,
                            otomatis berada di tengah.
                        -->
                        <div
                            class="flex flex-wrap justify-center gap-6 md:gap-8 w-full mb-6 md:mb-8"
                        >
                            {#each rowBerita as berita}

                                <button
                                    on:click={() => openBerita(berita.link)}
                                    class="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1.35rem)] text-left flex flex-col overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                                >

                                    <!-- IMAGE -->
                                    <div
                                        class="w-full aspect-video bg-slate-100 overflow-hidden"
                                    >
                                        {#if berita.coverImage}

                                            <img
                                                src={berita.coverImage}
                                                alt={berita.title}
                                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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

                                    <!-- CONTENT -->
                                    <div class="flex flex-col flex-1 p-5">

                                        <h3
                                            class="font-bold text-[#0b355b] text-base leading-snug line-clamp-2"
                                        >
                                            {berita.title}
                                        </h3>

                                        <span
                                            class="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0a4682] group-hover:gap-2 transition-all"
                                        >
                                            Baca Selengkapnya

                                            <svg
                                                class="w-3.5 h-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                stroke-width="2.5"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                                />
                                            </svg>
                                        </span>

                                    </div>

                                </button>

                            {/each}
                        </div>

                    {/each}

                    <!-- SHOW MORE -->
                    {#if hasMoreBerita}

                        <div class="flex justify-center mt-8">

                            <button
                                on:click={showMoreBerita}
                                class="group flex items-center gap-2 px-7 py-3 rounded-xl bg-[#0b355b] hover:bg-[#1a5c8c] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                            >
                                Show More

                                <svg
                                    class="w-4 h-4 group-hover:translate-y-0.5 transition-transform"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M6 9l6 6 6-6"
                                    />
                                </svg>
                            </button>

                        </div>

                    {/if}

                </div>

            {/if}
        </div>
    </section>

</div>

<footer>
    <Footer />
</footer>