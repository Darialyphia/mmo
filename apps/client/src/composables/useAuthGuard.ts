export const useAuthGuard = () => {
  const router = useRouter();
  const route = useRoute();

  const { authService } = useApi();

  router.beforeEach((to, from, next) => {
    const isAuth = authService.isAuthenticated();
    if (!to.meta.public && !isAuth) {
      return next({
        name: 'Login',
        query: { from: encodeURIComponent(to.fullPath) }
      });
    }
    if (to.meta.public && isAuth) {
      return next((from.query.from as string) ?? '/');
    }

    return next();
  });

  watchEffect(() => {
    if (!route.name) return;

    const isAuth = authService.isAuthenticated();
    if (!route.meta.public && !isAuth) {
      router.push({ name: 'Login', query: { from: route.fullPath } });
    }
    if (route.meta.public && isAuth) {
      router.push((route.query.from as string) ?? '/');
    }
  });
};
