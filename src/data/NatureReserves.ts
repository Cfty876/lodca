export interface ReserveData {
    id: string;
    name: string;
    description: string;
    center: [number, number];
    zoom: number;
    type: 'reserve' | 'national_park';
}

export const NATURE_RESERVES: ReserveData[] = [
    {
        id: 'baikal',
        name: 'Байкальский заповедник',
        description: 'Государственный природный биосферный заповедник на южном побережье Байкала.',
        center: [51.5, 105.3],
        zoom: 10,
        type: 'reserve'
    },
    {
        id: 'altay',
        name: 'Алтайский заповедник',
        description: 'Один из крупнейших заповедников России, объект всемирного наследия ЮНЕСКО.',
        center: [51.2, 87.7],
        zoom: 9,
        type: 'reserve'
    },
    {
        id: 'kavkaz',
        name: 'Кавказский заповедник',
        description: 'Старейшая особо охраняемая природная территория на Северном Кавказе.',
        center: [43.9, 40.2],
        zoom: 11,
        type: 'reserve'
    },
    {
        id: 'kronotsky',
        name: 'Кроноцкий заповедник',
        description: 'Один из старейших заповедников России, расположен на Камчатке.',
        center: [54.5, 160.8],
        zoom: 9,
        type: 'reserve'
    },
    {
        id: 'sayano',
        name: 'Саяно-Шушенский заповедник',
        description: 'Расположен в труднодоступном районе Западного Саяна.',
        center: [52.3, 91.8],
        zoom: 10,
        type: 'reserve'
    },
    {
        id: 'valday',
        name: 'Валдайский национальный парк',
        description: 'Национальный парк в Новгородской области.',
        center: [58.0, 33.3],
        zoom: 11,
        type: 'national_park'
    },
    {
        id: 'losiny_ostrov',
        name: 'Лосиный Остров',
        description: 'Национальный парк на территории Москвы и Московской области.',
        center: [55.8, 37.8],
        zoom: 12,
        type: 'national_park'
    }
];
