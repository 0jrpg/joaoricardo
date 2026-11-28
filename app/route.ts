import { NextResponse } from "next/server";

// A página inicial não mostra nada de "site" — devolve um XML cru de
// AccessDenied, igual ao erro clássico de bucket S3. O visual de
// "This XML file does not appear to have any style information..." é
// desenhado automaticamente pelo próprio navegador quando o Content-Type é
// application/xml; não precisamos (nem devemos) recriar esse HTML/CSS.
export async function GET(request: Request) {
  const host = request.headers.get("host") || "cdnjoaoricardo.vercel.app";
  const userAgent = request.headers.get("user-agent") || "Unknown-Client";
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
  const country = request.headers.get("x-vercel-ip-country") || "BR";
  const city = request.headers.get("x-vercel-ip-city") || "Edge-Node";
  const vercelId = request.headers.get("x-vercel-id") || `gru1::${crypto.randomUUID().slice(0, 8)}`;

  const requestId = crypto.randomUUID().replace(/-/g, "").toUpperCase().slice(0, 16);
  const hostId = Buffer.from(`${host}::${vercelId}::edge-storage`).toString("base64");
  const timestamp = new Date().toISOString();

  const bucketName = process.env.GITHUB_REPO || "joaoricardo";
  const bucketOwner = process.env.GITHUB_OWNER || "0jrpg";
  const branch = process.env.GITHUB_BRANCH || "main";
  const rootPrefix = process.env.GITHUB_FILES_PATH || "files";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Error xmlns="http://amazonaws.com">
    <Code>AccessDenied</Code>
    <Message>Access Denied: Anonymous root bucket listing is disabled on this CDN endpoint.</Message>
    <Resource>/</Resource>
    <BucketName>${bucketName}</BucketName>
    <RequestId>${requestId}</RequestId>
    <HostId>${hostId}</HostId>
    <Endpoint>${host}</Endpoint>
    <Region>sa-east-1</Region>
    <AvailabilityZone>gru1-edge-az02</AvailabilityZone>
    <Timestamp>${timestamp}</Timestamp>
    <HTTPStatus>403 Forbidden</HTTPStatus>
    <PolicyEvaluation>
        <Action>s3:ListBucket</Action>
        <Effect>ExplicitDeny</Effect>
        <Principal>AnonymousUser</Principal>
        <EvaluatedStatements>
            <Statement>
                <Sid>DenyRootDirectoryEnumeration</Sid>
                <Resource>arn:aws:s3:::${bucketName}/*</Resource>
                <Condition>
                    <StringEquals>
                        <KeyPrefix>/</KeyPrefix>
                        <PublicListing>false</PublicListing>
                    </StringEquals>
                </Condition>
                <Result>DENY</Result>
            </Statement>
            <Statement>
                <Sid>AllowDirectObjectKeyRetrieval</Sid>
                <Resource>arn:aws:s3:::${bucketName}/${rootPrefix}/*</Resource>
                <Condition>
                    <Bool>
                        <ExactObjectKeyRequired>true</ExactObjectKeyRequired>
                    </Bool>
                </Condition>
                <Result>NOT_APPLICABLE_TO_ROOT</Result>
            </Statement>
        </EvaluatedStatements>
    </PolicyEvaluation>
    <StorageArchitecture>
        <Engine>GitHub-Edge-Object-Router/2.4</Engine>
        <UpstreamRepository>${bucketOwner}/${bucketName}</UpstreamRepository>
        <UpstreamBranch>${branch}</UpstreamBranch>
        <ObjectMountPath>/${rootPrefix}/</ObjectMountPath>
        <ContentDetection>
            <Strategy>MagicNumberBinarySniffing</Strategy>
            <Fallback>FileExtensionMimeLookup</Fallback>
            <RawInspectionRoute>/raw/{object-key}</RawInspectionRoute>
            <ManagementConsole>/admin</ManagementConsole>
        </ContentDetection>
        <SupportedMimeGroups>
            <MimeGroup name="documents">application/pdf, text/html, text/plain, text/markdown</MimeGroup>
            <MimeGroup name="images">image/png, image/jpeg, image/webp, image/gif, image/svg+xml, image/x-icon</MimeGroup>
            <MimeGroup name="media">audio/mpeg, audio/ogg, audio/wav, video/mp4, video/webm</MimeGroup>
            <MimeGroup name="web-assets">text/css, application/javascript, application/json, font/woff2</MimeGroup>
            <MimeGroup name="archives">application/zip, application/x-7z-compressed, application/vnd.rar</MimeGroup>
            <MimeGroup name="binary">application/octet-stream</MimeGroup>
        </SupportedMimeGroups>
    </StorageArchitecture>
    <RequestContext>
        <ClientIP>${forwardedFor}</ClientIP>
        <GeoLocation>${decodeURIComponent(city)}, ${country}</GeoLocation>
        <EdgeTraceId>${vercelId}</EdgeTraceId>
        <Protocol>HTTP/2.0</Protocol>
        <Encryption>TLSv1.3 (AEAD-AES128-GCM-SHA256)</Encryption>
        <CacheControl>no-store, must-revalidate</CacheControl>
        <UserAgent><![CDATA[${userAgent}]]></UserAgent>
    </RequestContext>
    <ResolutionHint>
        <Description>To retrieve an object from this CDN, specify its full relative key path in the URL.</Description>
        <DirectAccessExample>https://${host}/pasta/arquivo.ext</DirectAccessExample>
        <RawSourceExample>https://${host}/raw/pasta/arquivo.ext</RawSourceExample>
    </ResolutionHint>
</Error>`;

  return new NextResponse(xml, {
    status: 403,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Amz-Request-Id": requestId,
      "X-Amz-Id-2": hostId,
    },
  });
}
