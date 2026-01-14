"use client";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "fumadocs-ui/components/ui/collapsible";
import { ChevronDown, LoaderCircle, X } from "lucide-react";
import {
  type ComponentProps,
  type FC,
  Fragment,
  lazy,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import type {
  FieldPath,
  UseControllerProps,
  UseControllerReturn,
} from "react-hook-form";
import {
  FormProvider,
  get,
  set,
  useController,
  useForm,
  useFormContext,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FetchResult } from "@/openapi/playground/fetcher";
import type { ParameterField, SecurityEntry } from "@/openapi/playground/index";
import {
  type FieldInfo,
  SchemaProvider,
  type SchemaScope,
  useResolvedSchema,
} from "@/openapi/playground/schema";
import { encodeRequestData } from "@/openapi/requests/media/encode";
import type { RequestData } from "@/openapi/requests/types";
import { useStorageKey } from "@/openapi/ui/client/storage-key";
import { labelVariants } from "@/openapi/ui/components/input";
import { MethodLabel } from "@/openapi/ui/components/method-label";
import { useApiContext } from "@/openapi/ui/contexts/api";
import { cn } from "@/openapi/utils/cn";
import {
  joinURL,
  resolveRequestData,
  resolveServerUrl,
  withBase,
} from "@/openapi/utils/url";
import { useQuery } from "@/openapi/utils/use-query";
import { useExampleRequests } from "../ui/operation/usage-tabs/client";
import type { ParsedSchema } from "../utils/schema";
import {
  FieldInput,
  FieldSet,
  JsonInput,
  ObjectInput,
} from "./components/inputs";
import ServerSelect from "./components/server-select";
import { getStatusInfo } from "./status-info";

export interface FormValues {
  path: Record<string, unknown>;
  query: Record<string, unknown>;
  header: Record<string, unknown>;
  cookie: Record<string, unknown>;
  body: unknown;

  /**
   * Store the cached encoded request data, do not modify it.
   */
  _encoded?: RequestData;
}

export interface PlaygroundClientProps
  extends ComponentProps<"form">,
    SchemaScope {
  route: string;
  method: string;
  parameters?: ParameterField[];
  securities: SecurityEntry[][];
  body?: {
    schema: ParsedSchema;
    mediaType: string;
  };
  /**
   * Resolver for $ref schemas you've passed
   */
  references: Record<string, ParsedSchema>;
  proxyUrl?: string;
}

export interface PlaygroundClientOptions {
  /**
   * transform fields for auth-specific parameters (e.g. header)
   */
  transformAuthInputs?: (fields: AuthField[]) => AuthField[];

  /**
   * Request timeout in seconds (default: 10s)
   */
  requestTimeout?: number;

  components?: Partial<{
    ResultDisplay: FC<{ data: FetchResult }>;
  }>;

  /**
   * render the paremeter inputs of API endpoint.
   *
   * It uses `react-hook-form`, you can use either:
   * - the library itself, with types from `fumadocs-openapi/playground/client`.
   * - the `Custom.useController()` from `fumadocs-openapi/playground/client`.
   *
   * Recommended types packages: `json-schema-typed`, `openapi-types`.
   */
  renderParameterField?: (
    fieldName: FieldPath<FormValues>,
    param: ParameterField,
  ) => ReactNode;

  /**
   * render the input for API endpoint body.
   *
   * @see renderParameterField for customisation tips
   */
  renderBodyField?: (
    fieldName: "body",
    info: {
      schema: ParsedSchema;
      mediaType: string;
    },
  ) => ReactNode;
}

const OauthDialog = lazy(() =>
  import("./components/oauth-dialog").then((mod) => ({
    default: mod.OauthDialog,
  })),
);
const OauthDialogTrigger = lazy(() =>
  import("./components/oauth-dialog").then((mod) => ({
    default: mod.OauthDialogTrigger,
  })),
);

export default function PlaygroundClient({
  route,
  method = "GET",
  securities,
  parameters = [],
  body,
  references,
  proxyUrl,
  writeOnly,
  readOnly,
  ...rest
}: PlaygroundClientProps) {
  const { example: exampleId, examples, setExampleData } = useExampleRequests();
  const storageKeys = useStorageKey();
  const fieldInfoMap = useMemo(() => new Map<string, FieldInfo>(), []);
  const {
    mediaAdapters,
    serverRef,
    client: {
      playground: {
        components: { ResultDisplay = DefaultResultDisplay } = {},
        requestTimeout = 10,
        transformAuthInputs,
      } = {},
    },
  } = useApiContext();
  const [securityId, setSecurityId] = useState(0);
  const { inputs, mapInputs, initAuthValues } = useAuthInputs(
    securities[securityId],
    transformAuthInputs,
  );

  // 面板展开状态管理
  type PanelId =
    | "authorization"
    | "header"
    | "cookie"
    | "query"
    | "path"
    | "body";
  const [panelStates, setPanelStates] = useState<Record<PanelId, boolean>>(
    () => {
      // 初始化时从 localStorage 恢复面板状态
      if (typeof window === "undefined") {
        return {
          authorization: false,
          header: false,
          cookie: false,
          query: false,
          path: false,
          body: false,
        };
      }

      try {
        const panelStateKey = storageKeys.PanelState(route, method);
        const stored = localStorage.getItem(panelStateKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            return {
              authorization: parsed.authorization ?? false,
              header: parsed.header ?? false,
              cookie: parsed.cookie ?? false,
              query: parsed.query ?? false,
              path: parsed.path ?? false,
              body: parsed.body ?? false,
            };
          }
        }
      } catch {
        // 如果解析失败，使用默认值
      }

      return {
        authorization: false,
        header: false,
        cookie: false,
        query: false,
        path: false,
        body: false,
      };
    },
  );

  // 更新面板状态并保存到 localStorage
  const updatePanelState = useEffectEvent((panelId: PanelId, open: boolean) => {
    setPanelStates((prev) => {
      const newStates = { ...prev, [panelId]: open };

      // 保存到 localStorage
      if (typeof window !== "undefined") {
        try {
          const panelStateKey = storageKeys.PanelState(route, method);
          localStorage.setItem(panelStateKey, JSON.stringify(newStates));
        } catch {
          // 忽略存储错误
        }
      }

      return newStates;
    });
  });

  const defaultValues: FormValues = useMemo(() => {
    // 在 SSR 阶段，直接使用示例数据
    // localStorage 只在客户端可用
    if (typeof window === "undefined") {
      const requestData = examples.find(
        (example) => example.id === exampleId,
      )?.data;

      return {
        path: requestData?.path ?? {},
        query: requestData?.query ?? {},
        header: requestData?.header ?? {},
        body: requestData?.body ?? {},
        cookie: requestData?.cookie ?? {},
      };
    }

    // 客户端：从 localStorage 恢复表单数据
    // 1. 先从公共存储恢复 header
    let restoredHeader: Record<string, unknown> = {};
    try {
      const commonHeadersKey = storageKeys.CommonHeaders();
      const storedHeaders = localStorage.getItem(commonHeadersKey);
      if (storedHeaders) {
        const parsed = JSON.parse(storedHeaders);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          restoredHeader = parsed;
        }
      }
    } catch {
      // 如果解析失败，继续使用示例数据
    }

    // 2. 从接口特定存储恢复其他字段（path, query, body, cookie）
    const apiStorageKey = storageKeys.ApiForm(route, method);
    const storedData = localStorage.getItem(apiStorageKey);
    let restoredData: Partial<FormValues> = {};

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        // 验证数据结构是否正确
        if (
          parsed &&
          typeof parsed === "object" &&
          ("path" in parsed ||
            "query" in parsed ||
            "body" in parsed ||
            "cookie" in parsed)
        ) {
          restoredData = {
            path: parsed.path ?? {},
            query: parsed.query ?? {},
            body: parsed.body ?? {},
            cookie: parsed.cookie ?? {},
          };
        }
      } catch {
        // 如果解析失败，继续使用示例数据
      }
    }

    // 3. 合并恢复的数据和示例数据
    const requestData = examples.find(
      (example) => example.id === exampleId,
    )?.data;

    return {
      path: restoredData.path ?? requestData?.path ?? {},
      query: restoredData.query ?? requestData?.query ?? {},
      header:
        Object.keys(restoredHeader).length > 0
          ? restoredHeader
          : (requestData?.header ?? {}),
      body: restoredData.body ?? requestData?.body ?? {},
      cookie: restoredData.cookie ?? requestData?.cookie ?? {},
    };
  }, [examples, exampleId, route, method, storageKeys]);

  const form = useForm<FormValues>({
    defaultValues,
  });

  const testQuery = useQuery(async (input: FormValues) => {
    const targetServer = serverRef.current;
    const fetcher = await import("./fetcher").then((mod) =>
      mod.createBrowserFetcher(mediaAdapters, requestTimeout),
    );

    input._encoded ??= encodeRequestData(
      { ...mapInputs(input), method, bodyMediaType: body?.mediaType },
      mediaAdapters,
      parameters,
    );

    return fetcher.fetch(
      joinURL(
        withBase(
          targetServer
            ? resolveServerUrl(targetServer.url, targetServer.variables)
            : "/",
          window.location.origin,
        ),
        resolveRequestData(route, input._encoded),
      ),
      {
        proxyUrl,
        ...input._encoded,
      },
    );
  });

  const onUpdateDebounced = useEffectEvent((values: FormValues) => {
    // 只在客户端环境中保存到 localStorage
    if (typeof window !== "undefined") {
      // 保存认证字段
      for (const item of inputs) {
        const value = get(values, item.fieldName);

        if (value) {
          try {
            localStorage.setItem(
              storageKeys.AuthField(item),
              JSON.stringify(value),
            );
          } catch {
            // 忽略 localStorage 写入错误（如存储空间已满）
          }
        }
      }

      // 保存 header 到公共存储（所有接口共享）
      try {
        const commonHeadersKey = storageKeys.CommonHeaders();
        const headersToStore = values.header ?? {};
        localStorage.setItem(commonHeadersKey, JSON.stringify(headersToStore));
      } catch {
        // 忽略 localStorage 写入错误（如存储空间已满）
      }

      // 保存其他字段（path, query, body, cookie）到接口特定存储
      try {
        const apiStorageKey = storageKeys.ApiForm(route, method);
        const formDataToStore = {
          path: values.path ?? {},
          query: values.query ?? {},
          body: values.body ?? {},
          cookie: values.cookie ?? {},
        };
        localStorage.setItem(apiStorageKey, JSON.stringify(formDataToStore));
      } catch {
        // 忽略 localStorage 写入错误（如存储空间已满）
      }
    }

    const data = {
      ...mapInputs(values),
      method,
      bodyMediaType: body?.mediaType,
    };
    values._encoded ??= encodeRequestData(data, mediaAdapters, parameters);
    setExampleData(data, values._encoded);
  });

  useEffect(() => {
    let timer: number | null = null;

    const subscription = form.subscribe({
      formState: {
        values: true,
      },
      callback({ values }) {
        // remove cached encoded request data
        delete values._encoded;

        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(
          () => onUpdateDebounced(values),
          timer ? 400 : 0,
        );
      },
    });

    return () => subscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mounted once only
  }, []);

  useEffect(() => {
    form.reset(initAuthValues(defaultValues));

    return () => fieldInfoMap.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ignore other parts
  }, [defaultValues]);

  useEffect(() => {
    form.reset((values) => initAuthValues(values));

    return () => {
      form.reset((values) => {
        for (const item of inputs) {
          set(values, item.fieldName, undefined);
        }

        return values;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ignore other parts
  }, [inputs]);

  const onSubmit = form.handleSubmit((value) => {
    testQuery.start(mapInputs(value));
  });

  return (
    <FormProvider {...form}>
      <SchemaProvider
        fieldInfoMap={fieldInfoMap}
        references={references}
        writeOnly={writeOnly}
        readOnly={readOnly}
      >
        <form
          {...rest}
          className={cn(
            "not-prose flex flex-col rounded-xl border shadow-md overflow-hidden bg-fd-card text-fd-card-foreground",
            rest.className,
          )}
          onSubmit={onSubmit}
        >
          <ServerSelect />
          <div className="flex flex-row items-center gap-2 text-sm p-3 not-last:pb-0">
            <MethodLabel>{method}</MethodLabel>
            <Route route={route} className="flex-1" />
            <button
              type="submit"
              className={cn(
                buttonVariants({ color: "primary", size: "sm" }),
                "w-14 py-1.5",
              )}
              disabled={testQuery.isLoading}
            >
              {testQuery.isLoading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                "Send"
              )}
            </button>
          </div>

          {securities.length > 0 && (
            <SecurityTabs
              securities={securities}
              securityId={securityId}
              setSecurityId={setSecurityId}
              open={panelStates.authorization}
              onOpenChange={(open) => updatePanelState("authorization", open)}
            >
              {inputs.map((input) => (
                <Fragment key={input.fieldName}>{input.children}</Fragment>
              ))}
            </SecurityTabs>
          )}
          <FormBody
            body={body}
            parameters={parameters}
            panelStates={panelStates}
            updatePanelState={updatePanelState}
          />
          {testQuery.data ? (
            <ResultDisplay data={testQuery.data} reset={testQuery.reset} />
          ) : null}
        </form>
      </SchemaProvider>
    </FormProvider>
  );
}

function SecurityTabs({
  securities,
  setSecurityId,
  securityId,
  children,
  open,
  onOpenChange,
}: {
  securities: SecurityEntry[][];
  securityId: number;
  setSecurityId: (value: number) => void;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [oauthOpen, setOauthOpen] = useState(false);
  const form = useFormContext();

  const result = (
    <CollapsiblePanel
      title="Authorization"
      open={open}
      onOpenChange={onOpenChange}
    >
      <Select
        value={securityId.toString()}
        onValueChange={(v) => setSecurityId(Number(v))}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {securities.map((security, i) => (
            <SelectItem key={i.toString()} value={i.toString()}>
              {security.map((item) => (
                <div key={item.id} className="max-w-[600px]">
                  <p className="font-mono font-medium">{item.id}</p>
                  <p className="text-fd-muted-foreground whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              ))}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {children}
    </CollapsiblePanel>
  );

  for (let i = 0; i < securities.length; i++) {
    const security = securities[i];

    for (const item of security) {
      if (item.type === "oauth2") {
        return (
          <OauthDialog
            scheme={item}
            scopes={item.scopes}
            open={oauthOpen}
            setOpen={(v) => {
              setOauthOpen(v);
              if (v) {
                setSecurityId(i);
              }
            }}
            setToken={(token) => form.setValue("header.Authorization", token)}
          >
            {result}
          </OauthDialog>
        );
      }
    }
  }

  return result;
}

const ParamTypes = ["path", "header", "cookie", "query"] as const;

function FormBody({
  parameters = [],
  body,
  panelStates,
  updatePanelState,
}: Pick<PlaygroundClientProps, "parameters" | "body"> & {
  panelStates: Record<
    "authorization" | "header" | "cookie" | "query" | "path" | "body",
    boolean
  >;
  updatePanelState: (
    panelId: "authorization" | "header" | "cookie" | "query" | "path" | "body",
    open: boolean,
  ) => void;
}) {
  const { renderParameterField, renderBodyField } =
    useApiContext().client.playground ?? {};
  const panels = useMemo(() => {
    return ParamTypes.map((type) => {
      const items = parameters.filter((v) => v.in === type);
      if (items.length === 0) return null;

      const panelId = type as "header" | "cookie" | "query" | "path";

      return (
        <CollapsiblePanel
          key={type}
          title={
            {
              header: "Header",
              cookie: "Cookies",
              query: "Query",
              path: "Path",
            }[type]
          }
          open={panelStates[panelId]}
          onOpenChange={(open) => updatePanelState(panelId, open)}
        >
          {items.map((field) => {
            const fieldName = `${type}.${field.name}` as const;
            if (renderParameterField) {
              return renderParameterField(fieldName, field);
            }

            const contentTypes = field.content && Object.keys(field.content);
            const schema = (
              field.content && contentTypes && contentTypes.length > 0
                ? field.content[contentTypes[0]].schema
                : field.schema
            ) as ParsedSchema;

            return (
              <FieldSet
                key={fieldName}
                name={field.name}
                fieldName={fieldName}
                field={schema}
              />
            );
          })}
        </CollapsiblePanel>
      );
    });
  }, [parameters, renderParameterField, panelStates, updatePanelState]);

  return (
    <>
      {panels}
      {body && (
        <CollapsiblePanel
          title="Body"
          open={panelStates.body}
          onOpenChange={(open) => updatePanelState("body", open)}
        >
          {renderBodyField ? (
            renderBodyField("body", body)
          ) : (
            <BodyInput field={body.schema} />
          )}
        </CollapsiblePanel>
      )}
    </>
  );
}

function BodyInput({ field: _field }: { field: ParsedSchema }) {
  const field = useResolvedSchema(_field);
  const [isJson, setIsJson] = useState(false);

  if (field.format === "binary")
    return <FieldSet field={field} fieldName="body" />;

  if (isJson)
    return (
      <>
        <button
          className={cn(
            buttonVariants({
              color: "secondary",
              size: "sm",
              className: "w-fit font-mono p-2",
            }),
          )}
          onClick={() => setIsJson(false)}
          type="button"
        >
          Close JSON Editor
        </button>
        <JsonInput fieldName="body" />
      </>
    );

  return (
    <FieldSet
      field={field}
      fieldName="body"
      collapsible={false}
      name={
        <button
          type="button"
          className={cn(
            buttonVariants({
              color: "secondary",
              size: "sm",
              className: "p-2",
            }),
          )}
          onClick={() => setIsJson(true)}
        >
          Open JSON Editor
        </button>
      }
    />
  );
}

export interface AuthField {
  fieldName: string;
  defaultValue: unknown;

  original?: SecurityEntry;
  children: ReactNode;

  mapOutput?: (values: unknown) => unknown;
}

function useAuthInputs(
  securities?: SecurityEntry[],
  transform?: (fields: AuthField[]) => AuthField[],
) {
  const storageKeys = useStorageKey();
  const inputs = useMemo(() => {
    const result: AuthField[] = [];
    if (!securities) return result;

    for (const security of securities) {
      if (security.type === "http" && security.scheme === "basic") {
        const fieldName = `header.Authorization`;

        result.push({
          fieldName,
          original: security,
          defaultValue: {
            username: "",
            password: "",
          },
          mapOutput(out) {
            if (out && typeof out === "object") {
              return `Basic ${btoa(`${"username" in out ? out.username : ""}:${"password" in out ? out.password : ""}`)}`;
            }

            return out;
          },
          children: (
            <ObjectInput
              field={{
                type: "object",
                properties: {
                  username: {
                    type: "string",
                  },
                  password: {
                    type: "string",
                  },
                },
                required: ["username", "password"],
              }}
              fieldName={fieldName}
            />
          ),
        });
      } else if (security.type === "oauth2") {
        const fieldName = "header.Authorization";

        result.push({
          fieldName: fieldName,
          original: security,
          defaultValue: "Bearer ",
          children: (
            <fieldset className="flex flex-col gap-2">
              <label htmlFor={fieldName} className={cn(labelVariants())}>
                Access Token
              </label>
              <div className="flex gap-2">
                <FieldInput
                  fieldName={fieldName}
                  isRequired
                  field={{
                    type: "string",
                  }}
                  className="flex-1"
                />

                <OauthDialogTrigger
                  type="button"
                  className={cn(
                    buttonVariants({
                      size: "sm",
                      color: "secondary",
                    }),
                  )}
                >
                  Authorize
                </OauthDialogTrigger>
              </div>
            </fieldset>
          ),
        });
      } else if (security.type === "http") {
        const fieldName = "header.Authorization";

        result.push({
          fieldName: fieldName,
          original: security,
          defaultValue: "Bearer ",
          children: (
            <FieldSet
              name="Authorization (header)"
              fieldName={fieldName}
              isRequired
              field={{
                type: "string",
              }}
            />
          ),
        });
      } else if (security.type === "apiKey") {
        const fieldName = `${security.in}.${security.name}`;

        result.push({
          fieldName,
          defaultValue: "",
          original: security,
          children: (
            <FieldSet
              fieldName={fieldName}
              name={`${security.name} (${security.in})`}
              isRequired
              field={{
                type: "string",
              }}
            />
          ),
        });
      } else {
        const fieldName = "header.Authorization";

        result.push({
          fieldName,
          defaultValue: "",
          original: security,
          children: (
            <>
              <FieldSet
                name="Authorization (header)"
                isRequired
                fieldName={fieldName}
                field={{
                  type: "string",
                }}
              />
              <p className="text-fd-muted-foreground text-xs">
                OpenID Connect is not supported at the moment, you can still set
                an access token here.
              </p>
            </>
          ),
        });
      }
    }

    return transform ? transform(result) : result;
  }, [securities, transform]);

  const mapInputs = (values: FormValues) => {
    const cloned = structuredClone(values);

    for (const item of inputs) {
      if (!item.mapOutput) continue;

      set(cloned, item.fieldName, item.mapOutput(get(cloned, item.fieldName)));
    }

    return cloned;
  };

  const initAuthValues = (values: FormValues) => {
    for (const item of inputs) {
      const stored = localStorage.getItem(storageKeys.AuthField(item));

      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === typeof item.defaultValue) {
          set(values, item.fieldName, parsed);
          continue;
        }
      }

      set(values, item.fieldName, item.defaultValue);
    }

    return values;
  };

  return { inputs, mapInputs, initAuthValues };
}

function Route({ route, ...props }: ComponentProps<"div"> & { route: string }) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-row items-center gap-0.5 overflow-auto text-nowrap",
        props.className,
      )}
    >
      {route.split("/").map((part, index) => (
        <Fragment key={index.toString()}>
          {index > 0 && <span className="text-fd-muted-foreground">/</span>}
          {part.startsWith("{") && part.endsWith("}") ? (
            <code className="bg-fd-primary/10 text-fd-primary">{part}</code>
          ) : (
            <code className="text-fd-foreground">{part}</code>
          )}
        </Fragment>
      ))}
    </div>
  );
}

function DefaultResultDisplay({
  data,
  reset,
}: {
  data: FetchResult;
  reset: () => void;
}) {
  const statusInfo = useMemo(() => getStatusInfo(data.status), [data.status]);
  const { shikiOptions } = useApiContext();

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex justify-between items-center">
        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-fd-foreground">
          <statusInfo.icon className={cn("size-4", statusInfo.color)} />
          {statusInfo.description}
        </div>
        <button
          type="button"
          className={cn(
            buttonVariants({ size: "icon-xs" }),
            "p-0 text-fd-muted-foreground hover:text-fd-accent-foreground [&_svg]:size-3.5",
          )}
          onClick={() => reset()}
          aria-label="Dismiss response"
        >
          <X />
        </button>
      </div>
      <p className="text-sm text-fd-muted-foreground">{data.status}</p>
      {data.data !== undefined && (
        <DynamicCodeBlock
          lang={
            typeof data.data === "string" && data.data.length > 50000
              ? "text"
              : data.type
          }
          code={
            typeof data.data === "string"
              ? data.data
              : JSON.stringify(data.data, null, 2)
          }
          options={shikiOptions}
        />
      )}
    </div>
  );
}

function CollapsiblePanel({
  title,
  children,
  open,
  onOpenChange,
  ...props
}: Omit<ComponentProps<"div">, "title"> & {
  title: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Collapsible
      {...props}
      open={open}
      onOpenChange={onOpenChange}
      className="border-b last:border-b-0"
    >
      <CollapsibleTrigger className="group w-full flex items-center gap-2 p-3 text-sm font-medium">
        {title}
        <ChevronDown className="ms-auto size-3.5 text-fd-muted-foreground group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-3 p-3 pt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// exports for customisations
export const Custom = {
  useController<
    TName extends FieldPath<FormValues> = FieldPath<FormValues>,
    TTransformedValues = FormValues,
  >(
    props: UseControllerProps<FormValues, TName, TTransformedValues>,
  ): UseControllerReturn<FormValues, TName> {
    return useController<FormValues, TName, TTransformedValues>(props);
  },
};
