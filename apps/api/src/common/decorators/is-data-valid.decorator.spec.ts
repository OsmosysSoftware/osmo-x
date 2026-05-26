import { BadRequestException } from '@nestjs/common';
import { ValidationArguments } from 'class-validator';
import { IsDataValidConstraint } from './is-data-valid.decorator';
import { ProvidersService } from 'src/modules/providers/providers.service';
import { ProviderChainsService } from 'src/modules/provider-chains/provider-chains.service';
import { ProviderChainMembersService } from 'src/modules/provider-chain-members/provider-chain-members.service';
import { ChannelType } from 'src/common/constants/notifications';

type Mocked<T> = { [K in keyof T]: jest.Mock };

interface Bundle {
  constraint: IsDataValidConstraint;
  providersService: Mocked<ProvidersService>;
  providerChainsService: Mocked<ProviderChainsService>;
  providerChainMembersService: Mocked<ProviderChainMembersService>;
}

function buildConstraint(): Bundle {
  const providersService = {
    getById: jest.fn(),
  } as unknown as Mocked<ProvidersService>;

  const providerChainsService = {
    getByProviderChainName: jest.fn(),
  } as unknown as Mocked<ProviderChainsService>;

  const providerChainMembersService = {
    getAllProviderChainMembersByChainId: jest.fn(),
  } as unknown as Mocked<ProviderChainMembersService>;

  const constraint = new IsDataValidConstraint(
    providersService as unknown as ProvidersService,
    providerChainsService as unknown as ProviderChainsService,
    providerChainMembersService as unknown as ProviderChainMembersService,
  );

  return { constraint, providersService, providerChainsService, providerChainMembersService };
}

function makeArgs(object: object): ValidationArguments {
  return { object } as unknown as ValidationArguments;
}

const validSmtpData = {
  from: 'a@x.com',
  to: 'b@x.com',
  subject: 'hi',
  text: 'body',
  html: '',
};

describe('IsDataValidConstraint', () => {
  describe('validate', () => {
    it('returns false when neither providerId nor providerChain is set', async () => {
      const { constraint } = buildConstraint();

      const result = await constraint.validate(
        validSmtpData,
        makeArgs({ providerId: null, providerChain: null }),
      );

      expect(result).toBe(false);
    });

    it('providerId path: returns true when data matches the channel DTO', async () => {
      const { constraint, providersService } = buildConstraint();
      providersService.getById.mockResolvedValue({
        providerId: 10,
        channelType: ChannelType.SMTP,
      });

      const result = await constraint.validate(
        validSmtpData,
        makeArgs({ providerId: 10, data: validSmtpData }),
      );

      expect(result).toBe(true);
      expect(providersService.getById).toHaveBeenCalledWith(10);
    });

    it('providerId path: throws BadRequestException when data fails channel DTO validation', async () => {
      const { constraint, providersService } = buildConstraint();
      providersService.getById.mockResolvedValue({
        providerId: 10,
        channelType: ChannelType.SMTP,
      });

      await expect(
        constraint.validate(
          { from: 'a@x.com' }, // missing required fields
          makeArgs({ providerId: 10, data: { from: 'a@x.com' } }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('providerId path: throws BadRequestException when provider not found', async () => {
      const { constraint, providersService } = buildConstraint();
      providersService.getById.mockResolvedValue(null);

      await expect(
        constraint.validate(validSmtpData, makeArgs({ providerId: 999, data: validSmtpData })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('providerId path: returns false when channel type has no mapped DTO', async () => {
      const { constraint, providersService } = buildConstraint();
      providersService.getById.mockResolvedValue({
        providerId: 10,
        channelType: 999,
      });

      const result = await constraint.validate(
        validSmtpData,
        makeArgs({ providerId: 10, data: validSmtpData }),
      );

      expect(result).toBe(false);
    });

    it('providerChain path: validates against every member sequentially', async () => {
      const { constraint, providersService, providerChainsService, providerChainMembersService } =
        buildConstraint();
      providerChainsService.getByProviderChainName.mockResolvedValue({
        chainId: 7,
        chainName: 'fallback',
        applicationId: 100,
      });
      providerChainMembersService.getAllProviderChainMembersByChainId.mockResolvedValue([
        { id: 1, providerId: 10 },
        { id: 2, providerId: 11 },
      ]);
      providersService.getById
        .mockResolvedValueOnce({ providerId: 10, channelType: ChannelType.SMTP })
        .mockResolvedValueOnce({ providerId: 11, channelType: ChannelType.SMTP });

      const result = await constraint.validate(
        validSmtpData,
        makeArgs({ providerChain: 'fallback', data: validSmtpData }),
      );

      expect(result).toBe(true);
      expect(providersService.getById).toHaveBeenCalledTimes(2);
      expect(providersService.getById).toHaveBeenNthCalledWith(1, 10);
      expect(providersService.getById).toHaveBeenNthCalledWith(2, 11);
    });

    it('providerChain path: throws BadRequestException when chain not found', async () => {
      const { constraint, providerChainsService } = buildConstraint();
      providerChainsService.getByProviderChainName.mockResolvedValue(null);

      await expect(
        constraint.validate(
          validSmtpData,
          makeArgs({ providerChain: 'missing', data: validSmtpData }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('providerChain path: throws BadRequestException when chain has no members', async () => {
      const { constraint, providerChainsService, providerChainMembersService } = buildConstraint();
      providerChainsService.getByProviderChainName.mockResolvedValue({ chainId: 7 });
      providerChainMembersService.getAllProviderChainMembersByChainId.mockResolvedValue(null);

      await expect(
        constraint.validate(
          validSmtpData,
          makeArgs({ providerChain: 'empty', data: validSmtpData }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('providerChain path: throws BadRequestException when a member provider does not exist', async () => {
      const { constraint, providersService, providerChainsService, providerChainMembersService } =
        buildConstraint();
      providerChainsService.getByProviderChainName.mockResolvedValue({ chainId: 7 });
      providerChainMembersService.getAllProviderChainMembersByChainId.mockResolvedValue([
        { id: 1, providerId: 10 },
      ]);
      providersService.getById.mockResolvedValue(null);

      await expect(
        constraint.validate(
          validSmtpData,
          makeArgs({ providerChain: 'fallback', data: validSmtpData }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
