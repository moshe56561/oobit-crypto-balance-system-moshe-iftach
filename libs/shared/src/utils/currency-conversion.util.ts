import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class CurrencyConversionUtil {
  private readonly apiUrl = 'https://open.er-api.com/v6/latest';

  constructor(private readonly httpService: HttpService) {}

  async convertToCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount; // No conversion needed
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/${fromCurrency}`),
      );
      const rates = response.data.rates;
      const rate = rates[toCurrency];

      if (!rate) {
        throw new Error(`Conversion rate for ${toCurrency} not found.`);
      }

      return amount * rate;
    } catch (error) {
      console.error('Error during currency conversion:', error.message);
      throw new Error('Currency conversion failed.');
    }
  }

  // Validate the given currency by checking it against the supported currencies
  async isValidCurrency(currency: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.httpService.get(this.apiUrl));

      const supportedCurrencies = Object.keys(response.data.rates);

      return supportedCurrencies.includes(currency.toUpperCase());
    } catch (error) {
      console.error('Error fetching supported currencies:', error.message);
      throw new HttpException(
        'Failed to fetch supported currencies',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
