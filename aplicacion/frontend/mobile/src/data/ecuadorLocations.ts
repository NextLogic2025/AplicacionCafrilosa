export type EcuadorCity = {
    name: string
    lat: number
    lng: number
}

export type EcuadorProvince = {
    province: string
    macro: 'Sierra' | 'Costa' | 'Amazonia' | 'Insular'
    cities: EcuadorCity[]
}

export const ECUADOR_LOCATIONS: EcuadorProvince[] = [
    {
        province: 'Azuay',
        macro: 'Sierra',
        cities: [
            { name: 'Cuenca', lat: -2.9001, lng: -79.0059 },
            { name: 'Gualaceo', lat: -2.8926, lng: -78.7806 },
            { name: 'Paute', lat: -2.7959, lng: -78.7636 },
        ],
    },
    {
        province: 'Bolivar',
        macro: 'Sierra',
        cities: [
            { name: 'Guaranda', lat: -1.5932, lng: -79.0015 },
            { name: 'San Miguel', lat: -1.7047, lng: -79.0147 },
            { name: 'Caluma', lat: -1.7020, lng: -79.2352 },
        ],
    },
    {
        province: 'Canar',
        macro: 'Sierra',
        cities: [
            { name: 'Azogues', lat: -2.7399, lng: -78.8486 },
            { name: 'Canar', lat: -2.5566, lng: -78.9399 },
            { name: 'La Troncal', lat: -2.4239, lng: -79.3397 },
        ],
    },
    {
        province: 'Carchi',
        macro: 'Sierra',
        cities: [
            { name: 'Tulcan', lat: 0.8115, lng: -77.7182 },
            { name: 'San Gabriel', lat: 0.6129, lng: -77.8295 },
            { name: 'Mira', lat: 0.3323, lng: -78.0822 },
        ],
    },
    {
        province: 'Chimborazo',
        macro: 'Sierra',
        cities: [
            { name: 'Riobamba', lat: -1.6636, lng: -78.6546 },
            { name: 'Guano', lat: -1.6090, lng: -78.6311 },
            { name: 'Alausi', lat: -2.2040, lng: -78.8450 },
        ],
    },
    {
        province: 'Cotopaxi',
        macro: 'Sierra',
        cities: [
            { name: 'Latacunga', lat: -0.9352, lng: -78.6167 },
            { name: 'Saquisili', lat: -0.8287, lng: -78.6601 },
            { name: 'Pujili', lat: -0.9585, lng: -78.6978 },
        ],
    },
    {
        province: 'El Oro',
        macro: 'Costa',
        cities: [
            { name: 'Machala', lat: -3.2581, lng: -79.9609 },
            { name: 'Santa Rosa', lat: -3.4488, lng: -79.9592 },
            { name: 'Pasaje', lat: -3.3250, lng: -79.8060 },
        ],
    },
    {
        province: 'Esmeraldas',
        macro: 'Costa',
        cities: [
            { name: 'Esmeraldas', lat: 0.9682, lng: -79.6517 },
            { name: 'Atacames', lat: 0.8611, lng: -79.8327 },
            { name: 'Quininde', lat: 0.3394, lng: -79.4597 },
        ],
    },
    {
        province: 'Galapagos',
        macro: 'Insular',
        cities: [
            { name: 'Puerto Baquerizo Moreno', lat: -0.9033, lng: -89.6046 },
            { name: 'Puerto Ayora', lat: -0.7420, lng: -90.3133 },
            { name: 'Puerto Villamil', lat: -0.9550, lng: -90.9650 },
        ],
    },
    {
        province: 'Guayas',
        macro: 'Costa',
        cities: [
            { name: 'Guayaquil', lat: -2.1709, lng: -79.9227 },
            { name: 'Duran', lat: -2.1710, lng: -79.8519 },
            { name: 'Milagro', lat: -2.1320, lng: -79.5940 },
        ],
    },
    {
        province: 'Imbabura',
        macro: 'Sierra',
        cities: [
            { name: 'Ibarra', lat: 0.3517, lng: -78.1223 },
            { name: 'Otavalo', lat: 0.2333, lng: -78.2667 },
            { name: 'Cotacachi', lat: 0.3011, lng: -78.2641 },
        ],
    },
    {
        province: 'Loja',
        macro: 'Sierra',
        cities: [
            { name: 'Loja', lat: -3.9931, lng: -79.2042 },
            { name: 'Catamayo', lat: -3.9881, lng: -79.3538 },
            { name: 'Macara', lat: -4.3833, lng: -79.9469 },
        ],
    },
    {
        province: 'Los Rios',
        macro: 'Costa',
        cities: [
            { name: 'Babahoyo', lat: -1.8022, lng: -79.5344 },
            { name: 'Quevedo', lat: -1.0286, lng: -79.4594 },
            { name: 'Ventanas', lat: -1.4440, lng: -79.4600 },
        ],
    },
    {
        province: 'Manabi',
        macro: 'Costa',
        cities: [
            { name: 'Portoviejo', lat: -1.0546, lng: -80.4525 },
            { name: 'Manta', lat: -0.9677, lng: -80.7089 },
            { name: 'Chone', lat: -0.6976, lng: -80.0936 },
        ],
    },
    {
        province: 'Morona Santiago',
        macro: 'Amazonia',
        cities: [
            { name: 'Macas', lat: -2.3145, lng: -78.1108 },
            { name: 'Gualaquiza', lat: -3.4033, lng: -78.5788 },
            { name: 'Sucua', lat: -2.4560, lng: -78.1720 },
        ],
    },
    {
        province: 'Napo',
        macro: 'Amazonia',
        cities: [
            { name: 'Tena', lat: -0.9867, lng: -77.8129 },
            { name: 'Archidona', lat: -0.9123, lng: -77.8091 },
            { name: 'Baeza', lat: -0.4886, lng: -77.8966 },
        ],
    },
    {
        province: 'Orellana',
        macro: 'Amazonia',
        cities: [
            { name: 'Francisco de Orellana', lat: -0.4629, lng: -76.9867 },
            { name: 'La Joya de los Sachas', lat: -0.3410, lng: -76.8660 },
            { name: 'Loreto', lat: -0.6960, lng: -77.3000 },
        ],
    },
    {
        province: 'Pastaza',
        macro: 'Amazonia',
        cities: [
            { name: 'Puyo', lat: -1.4929, lng: -78.0029 },
            { name: 'Santa Clara', lat: -1.3040, lng: -77.9200 },
            { name: 'Arajuno', lat: -1.2000, lng: -77.6800 },
        ],
    },
    {
        province: 'Pichincha',
        macro: 'Sierra',
        cities: [
            { name: 'Quito', lat: -0.1807, lng: -78.4678 },
            { name: 'Sangolqui', lat: -0.3314, lng: -78.4501 },
            { name: 'Cayambe', lat: 0.0293, lng: -78.1450 },
        ],
    },
    {
        province: 'Santa Elena',
        macro: 'Costa',
        cities: [
            { name: 'Santa Elena', lat: -2.2300, lng: -80.8580 },
            { name: 'La Libertad', lat: -2.2330, lng: -80.9011 },
            { name: 'Salinas', lat: -2.2140, lng: -80.9580 },
        ],
    },
    {
        province: 'Santo Domingo de los Tsachilas',
        macro: 'Costa',
        cities: [
            { name: 'Santo Domingo', lat: -0.2530, lng: -79.1754 },
            { name: 'La Concordia', lat: -0.0039, lng: -79.3810 },
            { name: 'Alluriquin', lat: -0.2640, lng: -78.9980 },
        ],
    },
    {
        province: 'Sucumbios',
        macro: 'Amazonia',
        cities: [
            { name: 'Lago Agrio', lat: 0.0869, lng: -76.8896 },
            { name: 'Shushufindi', lat: -0.2670, lng: -76.6430 },
            { name: 'Cuyabeno', lat: -0.0160, lng: -76.1650 },
        ],
    },
    {
        province: 'Tungurahua',
        macro: 'Sierra',
        cities: [
            { name: 'Ambato', lat: -1.2540, lng: -78.6229 },
            { name: 'Banos de Agua Santa', lat: -1.3965, lng: -78.4247 },
            { name: 'Pelileo', lat: -1.3280, lng: -78.5360 },
        ],
    },
    {
        province: 'Zamora Chinchipe',
        macro: 'Amazonia',
        cities: [
            { name: 'Zamora', lat: -4.0670, lng: -78.9540 },
            { name: 'Yantzaza', lat: -3.8300, lng: -78.7590 },
            { name: 'Zumba', lat: -4.9500, lng: -79.1500 },
        ],
    },
] as const
