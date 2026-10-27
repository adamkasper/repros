// Instrumentation only: exposes the route table after `i18n:plugin` rebuilt it for the request's domain.
export default defineNuxtPlugin({
  dependsOn: ['i18n:plugin'],
  setup() {
    const routes = useRouter().getRoutes()
      .map(route => `${String(route.name)} ${route.path}${route.aliasOf ? ` (alias of ${route.aliasOf.path})` : ''}`)
    useRequestEvent()!.node.res.setHeader('x-repro-routes', JSON.stringify(routes))
  },
})
