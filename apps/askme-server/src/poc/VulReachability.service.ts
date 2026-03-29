import { Injectable, Logger } from '@nestjs/common';
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  END,
} from '@langchain/langgraph';
import { z } from 'zod';
import { VulnerabilityScannerService } from './VulnerabilityScanner.service';
import path from 'path';
import { SystemMessage } from 'langchain';

const State = new StateSchema({
  messages: MessagesValue,
  extraField: z.number(),
});

@Injectable()
export class VulReachabilityService {
  private logger = new Logger(VulReachabilityService.name);

  constructor(
    private readonly vulnerabilityScannerService: VulnerabilityScannerService,
  ) {}

  async scanDependencies(state: typeof State) {
    const result = await this.vulnerabilityScannerService.scan(
      path.resolve('..', '..'),
    );

    return {
      messages: new SystemMessage(
        `The following dependencies are vulnerable: ${result.dependencies.join(', ')}`,
      ),
    };
  }

  async parseCode(state: typeof State) {
    this.logger.log('parseCode', state);
    await Promise.resolve({
      code: 'code',
    });
  }

  async executeReachabilityAnalysis(sourcePath: string) {
    this.logger.log('executeReachabilityAnalysis', sourcePath);
    const graph = new StateGraph<typeof State>(State)
      .addNode('scanDeps', this.scanDependencies.bind(this))
      .addNode('parseCode', this.parseCode.bind(this))
      // .addNode('analyzeReachability', analyzeWithAI)
      // .addEdge('scanDeps', 'parseCode')
      // .addEdge('parseCode', 'analyzeReachability')
      // .addEdge('analyzeReachability', END);
      .addEdge('__start__', 'scanDeps')
      .addEdge('scanDeps', 'parseCode')
      .addEdge('parseCode', END);

    const compiledGraph = graph.compile();

    return compiledGraph.invoke({
      messages: [],
      extraField: 0,
    });
  }
}

// interface ScanState {
//   dependencies: any[];
//   vulnerabilities: any[];
//   reachableVulns: any[];
// }

export default VulReachabilityService;
