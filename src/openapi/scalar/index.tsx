import { lazy } from "react";
import type { MethodInformation, RenderContext } from "@/openapi/types";
import type { CreateAPIPageOptions } from "@/openapi/ui/api-page";

const Client = lazy(() => import("./client"));

function APIPlayground({
  path,
  method,
  ctx,
}: {
  path: string;
  method: MethodInformation;
  ctx: RenderContext;
}) {
  return (
    <Client method={method.method} path={path} spec={ctx.schema.bundled} />
  );
}

/**
 * Enable Scalar for API playgrounds by wrapping your options inside.
 *
 * Requires `@scalar/api-client-react` to be installed, it imports the styles automatically.
 */
export function withScalar(
  options: CreateAPIPageOptions = {},
): CreateAPIPageOptions {
  return {
    ...options,
    playground: {
      ...options.playground,
      render(props) {
        return <APIPlayground {...props} />;
      },
    },
  };
}
