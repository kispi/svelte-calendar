import { json } from '@sveltejs/kit'
import { KAKAO_CLIENT_SECRET } from '$env/static/private'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url }) => {
    const query = url.searchParams.get('query')

    if (!query) {
        return json({ documents: [] })
    }

    try {
        const response = await fetch(
            `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
            {
                headers: {
                    Authorization: `KakaoAK ${KAKAO_CLIENT_SECRET}`
                }
            }
        )

        if (!response.ok) {
            throw new Error('Failed to fetch from Kakao API')
        }

        const data = await response.json()
        return json(data)
    } catch (error) {
        console.error('Kakao API Error:', error)
        return json({ documents: [] }, { status: 500 })
    }
}
