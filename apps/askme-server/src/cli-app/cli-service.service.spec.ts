import { Test, TestingModule } from '@nestjs/testing';
import { CliServiceService } from './cli-service.service';

describe('CliServiceService', () => {
  let service: CliServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CliServiceService],
    }).compile();

    service = module.get<CliServiceService>(CliServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
