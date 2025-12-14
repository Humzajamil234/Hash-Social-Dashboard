const API_CONFIG = {
    BASE_URL: 'https://hatch-social.cstmpanel.com/api'
};


class MockAPI {
    constructor() {
        this.mockData = {
            interests: [
                { id: 1, category: 'sports', status: 'active' },
                { id: 2, category: 'music', status: 'inactive' },
                { id: 3, category: 'sports', status: 'active' },
                { id: 4, category: 'tech', status: 'active' },
            ]
        };
    }

    delay(ms = 300) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    mockResponse(data) {
        return {
            success: true,
            data
        };
    }

    async getInterests(params = {}) {
        await this.delay();
        let interests = [...this.mockData.interests];

        if (params.category) {
            interests = interests.filter(
                interest => interest.category === params.category
            );
        }

        if (params.status) {
            interests = interests.filter(
                interest => interest.status === params.status
            );
        }

        return this.mockResponse(interests);
    }async getInterests(params = {}) {
    const query = new URLSearchParams(params).toString();

    const url = `${API_CONFIG.BASE_URL}/interests${query ? `?${query}` : ''}`;

    console.log('API URL 👉', url);

    await this.delay();

    let interests = [...this.mockData.interests];

    if (params.category) {
        interests = interests.filter(
            interest => interest.category === params.category
        );
    }

    if (params.status) {
        interests = interests.filter(
            interest => interest.status === params.status
        );
    }

    return this.mockResponse(interests);
}

}

// 🔥 TEST
(async () => {
    const api = new MockAPI();

    console.log('\nAll interests:');
    console.log(await api.getInterests());

    console.log('\nOnly sports:');
    console.log(await api.getInterests({ category: 'sports' }));

    console.log('\nSports + active:');
    console.log(await api.getInterests({ category: 'sports', status: 'active' }));
})();
