<script>
    import Router from 'svelte-spa-router';
    import Dashboard from './routes/Dashboard.svelte';
    import Home from './routes/Home.svelte';
    import Admin from './routes/Admin/Admin.svelte';
    import Admin_anggota from './routes/Admin/Admin_anggota.svelte';
    import Admin_absensi from './routes/Admin/Admin_absensi.svelte';
    import Admin_analisis from './routes/Admin/Admin_analisis.svelte';
    import Admin_jadwal from './routes/Admin/Admin_jadwal.svelte';
    import SignIn from './routes/SignIn.svelte';
    import SignUp from './routes/SignUp.svelte';
    import User from './routes/User/User.svelte';
    import User_absensi from './routes/User/User_absensi.svelte';


    const routes = {
        '/': Dashboard,

        '/signin': SignIn,
        '/signup': SignUp,

        '/beranda': Admin,
        '/anggota': Admin_anggota,
        '/absensi': Admin_absensi,
        '/analisis': Admin_analisis,
        '/jadwal': Admin_jadwal,


        '/user': User,
        '/user_absensi': User_absensi,

        //'/user': Home,
        //'/admin': Admin,

    };
</script>

<main>
    <Router {routes} />
</main>