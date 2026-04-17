<script>
    import Router from 'svelte-spa-router';
    import Dashboard from './routes/Dashboard.svelte';
    import Home from './routes/Home.svelte';
    import Admin from './routes/Admin/Admin.svelte';
    import SignIn from './routes/SignIn.svelte';
    import SignUp from './routes/SignUp.svelte';
    import User from './routes/User/User.svelte';


    const routes = {
        '/': Dashboard,

        '/signin': SignIn,
        '/signup': SignUp,

        '/admin': Admin,
        '/user': User,

        //'/user': Home,
        //'/admin': Admin,

    };
</script>

<main>
    <Router {routes} />
</main>