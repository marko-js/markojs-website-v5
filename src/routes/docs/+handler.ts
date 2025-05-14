export const GET = ((ctx) => {
  return Response.redirect(new URL("tutorial/getting-started", ctx.url), 301);
}) satisfies MarkoRun.Handler;
