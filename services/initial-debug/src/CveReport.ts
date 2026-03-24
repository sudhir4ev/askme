class CveReport {
   private result: any

   private constructor(result: any) {
      this.result = result
   }

   static getCveReportForOSVResult(result: any) {
      return new CveReport(result)
   }

   
}

export default CveReport