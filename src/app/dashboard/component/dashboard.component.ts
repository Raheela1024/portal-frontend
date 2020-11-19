import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { HttpParams, JsonpInterceptor } from '@angular/common/http';
import { JsonPipe, Location } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';



import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { Sample, samples } from '../model/dashboard.model';
import { DashboardService } from '../services/dashboard.service';
import { filter } from 'rxjs/operators';

import 'jquery';
import { ArrayDataSource } from '@angular/cdk/collections';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  displayedColumns = ['accession', 'organism', 'commonName', 'sex', 'organismPart', 'trackingSystem'];
  bioSamples: Sample[];
  loading = true;
  dataSource = new MatTableDataSource<any>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  isSexFilterCollapsed = true;
  isOrgCollapsed = true;
  isTrackCollapsed = true;
  filterKeyName = '';
  itemLimitSexFilter: number;
  itemLimitOrgFilter: number;
  itemLimitTrackFilter: number;
  filterSize: number;
  urlAppendFilterArray = [];


  activeFilters = [];
  filtersMap;
  filters = {
    sex: {},
    trackingSystem: {},
    organismPart: {}
  };
  sexFilters = [];
  commonNameFilters = [];
  trackingSystemFilters = [];
  organismPartFilters = [];
  bioSampleTotalCount = 0;
  unpackedData;

  constructor(private titleService: Title, private dashboardService: DashboardService,
    private activatedRoute: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.filterSize = 3;
    this.itemLimitSexFilter = this.filterSize;
    this.itemLimitOrgFilter = this.filterSize;
    this.itemLimitTrackFilter = this.filterSize;
    this.getFilters();
    this.getAllBiosamples(0, 20, this.sort.active, this.sort.direction);
    this.titleService.setTitle('Data portal');
  }

  // tslint:disable-next-line:typedef
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // tslint:disable-next-line:typedef
  getAllBiosamples(offset, limit, sortColumn?, sortOrder?) {
    this.dashboardService.getAllBiosample(offset, limit, sortColumn, sortOrder)
      .subscribe(
        data => {
          const unpackedData = [];
          for (const item of data.biosamples) {
            unpackedData.push(this.unpackData(item));
          }
          this.bioSampleTotalCount = data.count;
          this.dataSource = new MatTableDataSource<any>(unpackedData);
          this.dataSource.sort = this.sort;
          this.dataSource.filterPredicate = this.filterPredicate;
          this.unpackedData = unpackedData;
        },
        err => console.log(err)
      );
  }

  getNextBiosamples(currentSize, offset, limit, sortColumn?, sortOrder?) {
    this.dashboardService.getAllBiosample(offset, limit, sortColumn, sortOrder)
      .subscribe(
        data => {
          const unpackedData = [];
          for (const item of data.biosamples) {
            unpackedData.push(this.unpackData(item));
          }
          this.dataSource = new MatTableDataSource<any>(unpackedData);
          this.dataSource.sort = this.sort;
          this.dataSource.filterPredicate = this.filterPredicate;
          this.unpackedData = unpackedData;
        },
        err => console.log(err)
      )
  }

  pageChanged(event) {
    let pageIndex = event.pageIndex;
    let pageSize = event.pageSize;
    let previousSize = pageSize * pageIndex;

    if (this.activeFilters.length !== 0) {
      let from = pageIndex * pageSize;
      let size = 0;
      if ((from + pageSize) < this.bioSampleTotalCount) {
        size = from + pageSize;
      }
      else {
        size = this.bioSampleTotalCount;
      }
      this.getFilterResults(this.activeFilters.toString(), this.sort.active, this.sort.direction, from, size);
    }
    else {
      this.getNextBiosamples(previousSize, (pageIndex).toString(), pageSize.toString(), this.sort.active, this.sort.direction);
    }
  }

  customSort(event) {
    let pageIndex = this.paginator.pageIndex;
    let pageSize = this.paginator.pageSize;

    if (this.activeFilters.length !== 0) {
      let from = pageIndex * pageSize;
      let size = 0;
      if ((from + pageSize) < this.bioSampleTotalCount) {
        size = from + pageSize;
      }
      else {
        size = this.bioSampleTotalCount;
      }
      this.getFilterResults(this.activeFilters.toString(), this.sort.active, this.sort.direction, from, size);
    }
    else {
      this.getAllBiosamples((pageIndex).toString(), pageSize.toString(), event.active, event.direction);
    }

  }

  // tslint:disable-next-line:typedef
  filterPredicate(data: any, filterValue: any): boolean {
    const filters = filterValue.split('|');
    if (filters[1] === 'Sex') {
      return data.sex.toLowerCase() === filters[0];
    } else if (filters[1] === 'Tracking Status') {
      return data.trackingSystem.toLowerCase() === filters[0];
    } else if (filters[1] === 'Organism Part') {
      return data.organismPart.toLowerCase() === filters[0];
    } else {
      return Object.values(data).join('').trim().toLowerCase().indexOf(filters[0]) !== -1;
    }
  }

  // tslint:disable-next-line:typedef
  unpackData(data: any) {
    const dataToReturn = {};
    if (data.hasOwnProperty('_source')) {
      data = data._source;
    }
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'object') {
        if (key === 'organism') {
          dataToReturn[key] = data.organism.text;
        }
      } else {
        dataToReturn[key] = data[key];
      }
    }
    return dataToReturn;
  }

  // tslint:disable-next-line:typedef
  getSearchResults(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (filterValue.length == 0) {
      this.getAllBiosamples(0, 20, this.sort.active, this.sort.direction);
    }
    else {
      this.dashboardService.getSearchResults(filterValue, this.sort.active, this.sort.direction)
        .subscribe(
          data => {
            const unpackedData = [];
            for (const item of data.biosamples) {
              unpackedData.push(this.unpackData(item));
            }
            this.bioSampleTotalCount = data.count;
            this.dataSource = new MatTableDataSource<any>(unpackedData);
            this.dataSource.sort = this.sort;
            this.dataSource.filterPredicate = this.filterPredicate;
            this.unpackedData = unpackedData;
          },
          err => {
            console.log(err);
          }
        )
    }
  }

  // tslint:disable-next-line:typedef
  checkFilterIsActive(key: string, filter: string) {
    if (this.activeFilters.indexOf(filter) !== -1) {
      return 'active';
    }

  }

  // tslint:disable-next-line:typedef
  onFilterClick(event, label: string, filter: string) {
    let filterQueryParam = { "name": label.replace(" ", "-").toLowerCase(), "value": filter };
    let inactiveClassName = label.toLowerCase().replace(" ", "-") + '-inactive';
    const filterIndex = this.activeFilters.indexOf(filter);

    if (filterIndex !== -1) {
      $('.' + inactiveClassName).removeClass('non-disp');
      this.removeFilter(filter);
    } else {
      $('.' + inactiveClassName).addClass('non-disp');
      $(event.target).removeClass('non-disp');
      $(event.target).addClass('disp');

      this.selectedFilterArray(label, filter);
      this.activeFilters.push(filter);
      this.dataSource.filter = `${filter.trim().toLowerCase()}|${label}`;
      this.getFilterResults(this.activeFilters.toString(), this.sort.active, this.sort.direction, 0, 20);
      this.updateActiveRouteParams();
    }

  }

  selectedFilterArray(key: string, value: string) {
    let jsonObj: {};
    if (key.replace(" ", "-").toLowerCase() == 'sex') {
      jsonObj = { "name": "sex", "value": value };
      this.urlAppendFilterArray.push(jsonObj);
    }
    else if (key.replace(" ", "-").toLowerCase() == "organism-part") {
      jsonObj = { "name": "organism-part", "value": value };
      this.urlAppendFilterArray.push(jsonObj);
    } else if (key.replace(" ", "-").toLowerCase() == "tracking-status") {
      jsonObj = { "name": "tracking-status", "value": value };
      this.urlAppendFilterArray.push(jsonObj);
    }

  }

  updateActiveRouteParams() {
    const params = {};
    const paramArray = this.urlAppendFilterArray.map(x => Object.assign({}, x));
    if (paramArray.length != 0) {
      for (let i = 0; i < paramArray.length; i++) {
        params[paramArray[i].name] = paramArray[i].value;
      }
      this.router.navigate(['data'], { queryParams: params });
    }
  }

  // tslint:disable-next-line:typedef
  removeAllFilters() {
    $('.sex-inactive').removeClass('non-disp');
    $('.organism-part-inactive').removeClass('non-disp');
    $('.tracking-status-inactive').removeClass('non-disp');

    this.activeFilters = [];
    this.urlAppendFilterArray = [];
    this.dataSource.filter = undefined;
    this.getAllBiosamples(0, 20, this.sort.active, this.sort.direction);
    this.router.navigate(['data'],{});
  }

  // tslint:disable-next-line:typedef
  removeFilter(filter: string) {
    if (filter != undefined) {
      this.updateDomForRemovedFilter(filter);
      this.updateActiveRouteParams();
      const filterIndex = this.activeFilters.indexOf(filter);
      this.activeFilters.splice(filterIndex, 1);
      if (this.activeFilters.length !== 0) {
        this.dataSource.filter = this.activeFilters[0].trim().toLowerCase();
        this.getFilterResults(this.activeFilters.toString(), this.sort.active, this.sort.direction, 0, 20);
      } else {
        this.router.navigate(['data'], {});
        this.dataSource.filter = undefined;
        this.getAllBiosamples(0, 20, this.sort.active, this.sort.direction);
      }
    }
  }

  updateDomForRemovedFilter(filter: string) {
    if (this.urlAppendFilterArray.length != 0) {
      let inactiveClassName: string;
      this.urlAppendFilterArray.filter(obj => {
        if (obj.value == filter) {
          inactiveClassName = obj.name + '-inactive';
          $('.' + inactiveClassName).removeClass('non-disp');
          $('.' + inactiveClassName).removeClass('active');
          $('.' + inactiveClassName).addClass('disp');

          const filterIndex = this.urlAppendFilterArray.indexOf(obj);
          this.urlAppendFilterArray.splice(filterIndex, 1);
        }
      });
    }
  }

  // tslint:disable-next-line:typedef
  getFilters() {
    this.dashboardService.getOrganismFilters().subscribe(
      data => {
        this.filtersMap = data;
        this.sexFilters = this.filtersMap.sex.filter(i => i !== "");
        this.trackingSystemFilters = this.filtersMap.trackingSystem.filter(i => i !== "");
        this.organismPartFilters = this.filtersMap.organismPart.filter(i => i !== "");
      },
      err => console.log(err)
    );


  }

  getStatusClass(status: string) {
    if (status === 'annotation complete') {
      return 'badge badge-pill badge-success';
    } else {
      return 'badge badge-pill badge-warning'
    }
  }

  getFilterResults(filter, sortColumn?, sortOrder?, from?, size?) {
    this.dashboardService.getFilterResults(filter, this.sort.active, this.sort.direction, from, size)
      .subscribe(
        data => {
          const unpackedData = [];
          for (const item of data.hits.hits) {
            unpackedData.push(this.unpackData(item));
          }
          this.bioSampleTotalCount = data.hits.total.value;
          this.dataSource = new MatTableDataSource<any>(unpackedData);
          this.dataSource.sort = this.sort;
          this.dataSource.filterPredicate = this.filterPredicate;
          this.unpackedData = unpackedData;
        },
        err => {
          console.log(err);
        }
      )
  }

  toggleCollapse(filterKey) {
    if (filterKey == 'Sex') {
      if (this.isSexFilterCollapsed) {
        this.itemLimitSexFilter = 10000;
        this.isSexFilterCollapsed = false;
      } else {
        this.itemLimitSexFilter = 3;
        this.isSexFilterCollapsed = true;
      }
    }
    else if (filterKey == 'Organism Part') {
      if (this.isOrgCollapsed) {
        this.itemLimitOrgFilter = 10000;
        this.isOrgCollapsed = false;
      } else {
        this.itemLimitOrgFilter = 3;
        this.isOrgCollapsed = true;
      }
    } else if (filterKey == 'Tracking Status') {
      if (this.isTrackCollapsed) {
        this.itemLimitTrackFilter = 10000;
        this.isTrackCollapsed = false;
      } else {
        this.itemLimitTrackFilter = 3;
        this.isTrackCollapsed = true;
      }
    }
  }

}
