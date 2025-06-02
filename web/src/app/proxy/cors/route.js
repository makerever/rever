export async function GET(req) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response(JSON.stringify({ error: "No URL provided" }), {
      status: 400,
    });
  }

  try {
    const externalResponse = await fetch(url);

    if (!externalResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch the PDF from the server" }),
        { status: externalResponse.status }
      );
    }

    const arrayBuffer = await externalResponse.arrayBuffer();

    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", "inline; filename=proxy.pdf");
    headers.set("Cache-Control", "no-store");

    return new Response(arrayBuffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("CORS Proxy Error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong while proxying the PDF" }),
      { status: 500 }
    );
  }
}
