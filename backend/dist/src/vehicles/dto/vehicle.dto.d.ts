export declare class CreateVehicleDto {
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    seats: number;
    transmission: string;
    fuel: string;
    color: string;
    dailyPrice: number;
    weekendPrice: number;
    holidayPrice: number;
    penaltyRate: number;
    images?: string[];
    videoUrl?: string;
    limitKmPerDay?: number;
    overLimitFee?: number;
    pickupLocation?: string;
    latitude?: number;
    longitude?: number;
    terms?: string;
}
export declare class SearchVehicleDto {
    startDate: string;
    endDate: string;
    brand?: string;
    seats?: number;
}
