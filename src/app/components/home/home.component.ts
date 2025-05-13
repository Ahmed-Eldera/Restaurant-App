import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Observable } from "rxjs";
import { Dish } from "../../models/dish.model";
import { DishService } from "../../services/dish.service";

@Component({
  standalone: true,
  selector: "app-home",
  imports: [CommonModule, RouterModule],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  featuredDishes$!: Observable<Dish[]>;

  constructor(private dishService: DishService) {}

  ngOnInit(): void {
    this.featuredDishes$ = this.dishService.getFeaturedDishes();
  }
}
