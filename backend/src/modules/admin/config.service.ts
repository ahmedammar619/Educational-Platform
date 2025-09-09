import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from './entities/app-config.entity';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(AppConfig)
    private readonly configRepository: Repository<AppConfig>,
  ) {}

  async getConfig(key: string): Promise<string | null> {
    const config = await this.configRepository.findOne({
      where: { key }
    });
    return config ? config.value : null;
  }

  async setConfig(key: string, value: string, description?: string): Promise<AppConfig> {
    let config = await this.configRepository.findOne({
      where: { key }
    });

    if (config) {
      config.value = value;
      config.description = description || config.description;
    } else {
      config = this.configRepository.create({
        key,
        value,
        description
      });
    }

    return this.configRepository.save(config);
  }

  async getGoogleFormUrl(): Promise<string | null> {
    return this.getConfig('google_form_url');
  }

  async setGoogleFormUrl(url: string): Promise<AppConfig> {
    return this.setConfig(
      'google_form_url',
      url,
      'Google Form URL for student registration when not enrolled in any class'
    );
  }
}
