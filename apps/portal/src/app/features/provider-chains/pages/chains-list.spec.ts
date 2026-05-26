import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ChainsListComponent } from './chains-list';
import { ConfigService } from '../../../core/services/config.service';
import {
  Application,
  Provider,
  ProviderChain,
  ProviderChainMember,
} from '../../../core/models/api.model';

class ConfigServiceStub {
  readonly apiUrl = 'http://test.local/api/v1';
  readonly apiDocsUrl = 'http://test.local/api/docs';

  load(): Promise<void> {
    return Promise.resolve();
  }
}

interface ChainMembersState {
  members: ProviderChainMember[];
  loading: boolean;
  orderChanged: boolean;
  saving: boolean;
}

describe('ChainsListComponent', () => {
  let fixture: ComponentFixture<ChainsListComponent>;
  let component: ChainsListComponent;
  let httpController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChainsListComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        MessageService,
        ConfirmationService,
        { provide: ConfigService, useClass: ConfigServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChainsListComponent);
    component = fixture.componentInstance;
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('getChainMembers', () => {
    it('returns a fresh default state when no entry exists for the chainId', () => {
      const result = component.getChainMembers(42);

      expect(result).toEqual({
        members: [],
        loading: true,
        orderChanged: false,
        saving: false,
      });
    });

    it('returns the stored entry when it exists in membersMap', () => {
      const member: ProviderChainMember = {
        chain_id: 1,
        provider_id: 5,
        priority_order: 1,
      } as ProviderChainMember;

      const state: ChainMembersState = {
        members: [member],
        loading: false,
        orderChanged: false,
        saving: false,
      };

      component.membersMap.set({ 1: state });

      expect(component.getChainMembers(1)).toBe(state);
    });

    it('keeps loading=true in the default to drive the skeleton branch', () => {
      // The template uses `getChainMembers(id).loading` to gate the skeleton.
      // Pre-load default must report loading so the spinner stays visible.
      expect(component.getChainMembers(7).loading).toBeTrue();
    });
  });

  describe('getAvailableProviders', () => {
    beforeEach(() => {
      const chain: ProviderChain = {
        chain_id: 1,
        application_id: 100,
        chain_name: 'C',
        provider_type: 1,
      } as ProviderChain;

      component.chains.set([chain]);

      const providers: Provider[] = [
        { provider_id: 1, name: 'P1', application_id: 100 } as Provider,
        { provider_id: 2, name: 'P2', application_id: 100 } as Provider,
        { provider_id: 3, name: 'P3', application_id: 100 } as Provider,
        // Different application — should always be excluded.
        { provider_id: 4, name: 'P4-OTHER', application_id: 999 } as Provider,
      ];

      component.providers.set(providers);
    });

    it('filters providers by the chain application_id', () => {
      const result = component.getAvailableProviders(1);

      expect(result.map((p) => p.provider_id)).toEqual([1, 2, 3]);
      expect(result.find((p) => p.provider_id === 4)).toBeUndefined();
    });

    it('excludes providers already used as members of the chain', () => {
      component.membersMap.set({
        1: {
          members: [
            { chain_id: 1, provider_id: 2, priority_order: 1 } as ProviderChainMember,
          ],
          loading: false,
          orderChanged: false,
          saving: false,
        },
      });

      const result = component.getAvailableProviders(1);

      expect(result.map((p) => p.provider_id)).toEqual([1, 3]);
    });

    it('returns an empty array when the chain is not in the chains signal', () => {
      expect(component.getAvailableProviders(404)).toEqual([]);
    });
  });

  describe('getApplicationName', () => {
    it('returns the application name on match', () => {
      component.applications.set([
        { application_id: 1, name: 'App-One' } as Application,
      ]);

      expect(component.getApplicationName(1)).toBe('App-One');
    });

    it('returns App #<id> on miss', () => {
      component.applications.set([]);

      expect(component.getApplicationName(15)).toBe('App #15');
    });
  });

  describe('getProviderName', () => {
    it('returns the provider name on match', () => {
      component.providers.set([
        { provider_id: 8, name: 'EmailMain', application_id: 1 } as Provider,
      ]);

      expect(component.getProviderName(8)).toBe('EmailMain');
    });

    it('returns Provider #<id> on miss', () => {
      component.providers.set([]);

      expect(component.getProviderName(8)).toBe('Provider #8');
    });
  });

  describe('getProviderTypeLabel', () => {
    it('returns the mapped label for a known provider_type', () => {
      expect(component.getProviderTypeLabel(1)).toBe('Email');
      expect(component.getProviderTypeLabel(2)).toBe('SMS');
      expect(component.getProviderTypeLabel(3)).toBe('WhatsApp Business');
    });

    it('returns "Unknown" for an unmapped provider_type', () => {
      expect(component.getProviderTypeLabel(999)).toBe('Unknown');
    });
  });
});
