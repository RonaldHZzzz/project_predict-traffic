export async function getMatrixData(coordinates: { lng: number, lat: number; }[]) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/matrix/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coordinates }),
    })

    if (!response.ok) {
      throw new Error("Error al obtener matriz del backend")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error en getMatrixData:", error)
    return null
  }
}
